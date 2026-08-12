"use client";

import { LoadingState } from "@/components/custom/loading-state";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconMessageCircle,
  IconNews,
  IconPhoto,
  IconPhotoVideo,
  IconVideo,
} from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import {
  ConnectedAccount,
  fetchSocialAccountsSubscriptions,
  fetchSocialPosts,
  SocialPost,
} from "@/redux/api-slice/social-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/utils";

import { AccountSwitcher } from "./account-switcher";
import {
  AccountContext,
  AccountIdentity,
  CHANNELS,
  ChannelContext,
  SocialChannel,
} from "./channel-context";
import { formatPostedAt } from "./format";
import {
  countActivePostFilters,
  defaultPostFilters,
  PostFiltersPopover,
  stopValue,
  type PostFilters,
} from "./post-filters";
import { SocialPostDetail, SocialPostRowSkeleton } from "./post-card";
import { useInfiniteScroll } from "./use-infinite-scroll";

const CHANNEL_ICON: Record<SocialChannel, typeof IconBrandFacebook> = {
  facebook: IconBrandFacebook,
  instagram: IconBrandInstagram,
};

/** Thumbnail for a post row — its first media, or a type icon when it has none. */
function PostRowThumbnail({ post }: { post: SocialPost }) {
  const media = post.media_entries[0];
  const TypeIcon =
    post.media_type === "video"
      ? IconVideo
      : post.media_type === "carousel_album"
        ? IconPhotoVideo
        : post.media_type === "image"
          ? IconPhoto
          : IconNews;

  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
      {media?.thumbnail_url || media?.url ? (
        <Image
          src={media.thumbnail_url || media.url}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        <TypeIcon className="size-5 text-muted-foreground" />
      )}
    </div>
  );
}

/**
 * The posts screen for one channel, laid out like the DM inbox: the page
 * switcher and post list in a flush sidebar, and the open post with its
 * comments filling the pane beside it.
 */
export default function SocialPostsFeed({
  channelType,
}: {
  channelType: SocialChannel;
}) {
  const channel = CHANNELS[channelType];
  const ChannelIcon = CHANNEL_ICON[channelType];
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchSocialPostsData, FetchSocialPostsIsLoading } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchSocialPostsState,
  );
  const {
    FetchSocialAccountsSubscriptionsData,
    FetchSocialAccountsSubscriptionsIsLoading,
    FetchSocialAccountsSubscriptionsIsSuccess,
    FetchSocialAccountsSubscriptionsIsError,
  } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchSocialAccountSubscriptionsState,
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  // Also loading before the first request resolves: the flag starts false,
  // so keying only on it flashes an empty switcher on the first paint.
  const accountsLoading =
    FetchSocialAccountsSubscriptionsIsLoading ||
    (!FetchSocialAccountsSubscriptionsIsSuccess &&
      !FetchSocialAccountsSubscriptionsIsError);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  // Null until the posts arrive: the slider ceilings come from the data, so
  // there's nothing meaningful to default to before then.
  const [filters, setFilters] = useState<PostFilters | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The open post lives in the URL (?post=<external id>) so a post and its
  // comments can be shared with teammates and deep-linked directly.
  const postParam = searchParams?.get("post") ?? null;
  const [appliedPostParam, setAppliedPostParam] = useState<string | null>(null);

  // The accounts/posts state slots are shared by both channel screens, so
  // the store may briefly hold the other channel's rows right after
  // navigating. Filter by channel_type so only this channel's data renders.
  const accounts = useMemo(
    () =>
      (FetchSocialAccountsSubscriptionsData?.results ?? []).filter(
        (acc) => acc.channel_type === channelType,
      ),
    [FetchSocialAccountsSubscriptionsData, channelType],
  );
  const selectedAccount: ConnectedAccount | null =
    accounts.find((acc) => String(acc.id) === selectedAccountId) ??
    accounts[0] ??
    null;

  useEffect(() => {
    if (storeCode) {
      // Fetch the store's connected accounts (client-side channel filter).
      dispatch(fetchSocialAccountsSubscriptions(storeCode));
    }
  }, [storeCode, dispatch]);

  const accountExternalId = selectedAccount?.external_id ?? null;

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Searching and filtering are resolved server-side, so any change to them
  // is a fresh page 1 rather than a client-side narrowing of what's loaded.
  // Adjusted during render (the endorsed alternative to setState-in-effect,
  // which would cascade a second render).
  const queryKey = JSON.stringify([
    accountExternalId,
    debouncedSearch,
    filters,
  ]);
  const [lastQueryKey, setLastQueryKey] = useState(queryKey);
  if (lastQueryKey !== queryKey) {
    setLastQueryKey(queryKey);
    setPage(1);
  }

  useEffect(() => {
    if (!storeCode || !accountExternalId) return;
    // Posts are scoped per account on the backend — addressed by the
    // account's external Graph id in the URL.
    dispatch(
      fetchSocialPosts({
        storeCode,
        accountId: accountExternalId,
        channelType,
        page,
        search: debouncedSearch || undefined,
        minLikes: filters ? stopValue(filters.likes[0]) : undefined,
        maxLikes: filters ? stopValue(filters.likes[1]) : undefined,
        minComments: filters ? stopValue(filters.comments[0]) : undefined,
        maxComments: filters ? stopValue(filters.comments[1]) : undefined,
        from: filters?.from || undefined,
        to: filters?.to || undefined,
      }),
    );
  }, [
    storeCode,
    accountExternalId,
    channelType,
    page,
    debouncedSearch,
    filters,
    dispatch,
  ]);

  const posts = useMemo(
    () =>
      (FetchSocialPostsData?.results ?? []).filter(
        (post) => post.channel_type === channelType,
      ),
    [FetchSocialPostsData, channelType],
  );

  const postsLoading = FetchSocialPostsIsLoading || accountsLoading;

  const activeFilters = filters ?? defaultPostFilters();
  const isFiltered =
    Boolean(search.trim()) || countActivePostFilters(activeFilters) > 0;
  const totalCount = FetchSocialPostsData?.count ?? posts.length;
  const hasMore = Boolean(FetchSocialPostsData?.next);

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    onLoadMore: () => setPage((prev) => prev + 1),
    hasMore,
    loading: FetchSocialPostsIsLoading,
  });

  // No auto-selection: a post opens via the ?post= URL param or a click, so
  // "no post selected" is a real state.
  let activePost = posts.find((post) => post.external_id === selectedPostId);

  // Apply the ?post= param once the list is available — this is what makes
  // shared post links open directly. Guarded render-time adjustment; clicks
  // flow the other way (state → URL).
  if (postParam && !postsLoading && appliedPostParam !== postParam) {
    setAppliedPostParam(postParam);
    const fromUrl = posts.find((post) => post.external_id === postParam);
    if (fromUrl) {
      setSelectedPostId(fromUrl.external_id);
      activePost = fromUrl;
    }
  }

  const postNotFound =
    !activePost &&
    !!postParam &&
    !postsLoading &&
    !posts.some((post) => post.external_id === postParam);

  const account: AccountIdentity = selectedAccount
    ? {
        name: selectedAccount.name || channel.accountFallback.name,
        username: selectedAccount.username || "",
        profilePictureUrl: selectedAccount.profile_picture_url || "",
      }
    : channel.accountFallback;

  const handleSelectPost = (post: SocialPost) => {
    setSelectedPostId(post.external_id);
    setAppliedPostParam(post.external_id);
    router.replace(`${pathname}?post=${encodeURIComponent(post.external_id)}`, {
      scroll: false,
    });
  };

  return (
    <ChannelContext.Provider value={channel}>
      <AccountContext.Provider value={account}>
        {/* Same shell as the DM inbox: a flush list beside the open item,
            filling the viewport below the header. */}
        <SidebarProvider
          style={{ "--sidebar-width": "350px" } as CSSProperties}
          className="-my-4 h-svh min-h-0 w-full overflow-hidden md:-my-6"
        >
          <Sidebar collapsible="none" className="hidden border-r md:flex">
            {/* h-16 and px-2 (the menu button adds its own p-2) so this row
                lines up exactly with the post header opposite. */}
            <SidebarHeader className="h-16 shrink-0 justify-center border-b px-2 py-0">
              <AccountSwitcher
                loading={accountsLoading}
                accounts={accounts}
                selectedAccount={selectedAccount}
                onSelectAccount={setSelectedAccountId}
                channelLabel={channel.label}
                ChannelIcon={ChannelIcon}
              />
            </SidebarHeader>
            <div className="flex items-center gap-2 border-b p-4">
              <SidebarInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search post content…"
                className="min-w-0 flex-1"
              />
              <PostFiltersPopover
                filters={activeFilters}
                onChange={setFilters}
                onClear={() => setFilters(defaultPostFilters())}
                matchCount={posts.length}
                totalCount={totalCount}
                isFiltered={isFiltered}
              />
            </div>
            <SidebarContent>
              <SidebarGroup className="px-0">
                <SidebarGroupContent>
                  {postsLoading && page === 1 ? (
                    <>
                      <SocialPostRowSkeleton />
                      <SocialPostRowSkeleton />
                      <SocialPostRowSkeleton />
                    </>
                  ) : !accounts.length ? (
                    <div className="p-4 text-center">
                      <Typography variant="muted">
                        No {channel.label} accounts connected for this store.
                      </Typography>
                    </div>
                  ) : posts.length ? (
                    posts.map((post) => {
                      const isSelected =
                        post.external_id === activePost?.external_id;

                      return (
                        <button
                          key={post.external_id}
                          type="button"
                          onClick={() => handleSelectPost(post)}
                          className={cn(
                            "flex w-full items-start gap-3 border-b p-4 text-left text-sm leading-tight transition-colors last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isSelected &&
                              "bg-sidebar-accent text-sidebar-accent-foreground",
                          )}
                        >
                          <PostRowThumbnail post={post} />
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 font-medium">
                              {post.content || "(no caption)"}
                            </div>
                            <Typography variant="muted" className="mt-1">
                              {formatPostedAt(post.posted_at)}
                            </Typography>
                            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <channel.LikeIcon className="size-3.5" />
                                {post.like_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <IconMessageCircle className="size-3.5" />
                                {post.comments_count}{" "}
                                {post.comments_count === 1
                                  ? "comment"
                                  : "comments"}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 p-6 text-center">
                      <IconNews className="mb-1 size-6 text-muted-foreground opacity-40" />
                      <Typography variant="small" as="p">
                        {isFiltered ? "No matches" : "No posts yet"}
                      </Typography>
                      <Typography variant="muted">
                        {isFiltered
                          ? "Try a different search or widen the filters."
                          : "Posts from this account will show up here."}
                      </Typography>
                    </div>
                  )}
                  {/* Pulls the next page as it comes into view. */}
                  {posts.length > 0 && hasMore && (
                    <div
                      ref={sentinelRef}
                      className="flex items-center justify-center p-4"
                    >
                      <Spinner className="size-4" />
                    </div>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <SidebarInset className="min-h-0 overflow-hidden">
            {activePost ? (
              <SocialPostDetail
                key={activePost.external_id}
                post={activePost}
              />
            ) : postsLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoadingState label="Loading posts…" />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center">
                <IconNews className="mb-1 size-6 text-muted-foreground opacity-40" />
                <Typography variant="small" as="p">
                  {postNotFound ? "Post not found" : "No post selected"}
                </Typography>
                <Typography variant="muted">
                  {postNotFound
                    ? "It may belong to another page. Pick another from the list."
                    : "Select a post from the list to read it and manage its comments."}
                </Typography>
              </div>
            )}
          </SidebarInset>
        </SidebarProvider>
      </AccountContext.Provider>
    </ChannelContext.Provider>
  );
}
