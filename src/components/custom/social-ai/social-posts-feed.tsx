"use client";

import {
  ConnectedAccount,
  fetchMetaPages,
  fetchSocialPosts,
  SocialPost,
} from "@/redux/api-slice/social-ai-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useEffect, useMemo, useState } from "react";

import { AccountCard } from "./account-card";
import {
  AccountContext,
  AccountIdentity,
  CHANNELS,
  ChannelContext,
  SocialChannel,
} from "./channel-context";
import { SocialPostCard, SocialPostSkeleton } from "./post-card";

// The full posts screen for one channel: sticky account sidebar (1 col) next
// to the scrolling posts feed (2 cols), stacked on small screens.
export default function SocialPostsFeed({
  channelType,
}: {
  channelType: SocialChannel;
}) {
  const channel = CHANNELS[channelType];
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchSocialPostsData, FetchSocialPostsIsLoading } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchSocialPostsState,
  );
  const { FetchMetaPagesData, FetchMetaPagesIsLoading } = useAppSelector(
    (state) => state.GetSocialAIReducer.FetchMetaPagesState,
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

    // The pages/posts state slots are shared by both channel screens, so the
    // store may briefly hold the other channel's rows right after navigating.
    // Filter by channel_type so only this channel's data ever renders.
    const accounts = useMemo(
        () =>
            (FetchMetaPagesData ?? []).filter(
                (acc) => acc.channel_type === channelType,
            ),
        [FetchMetaPagesData, channelType],
    );
    const selectedAccount: ConnectedAccount | null =
        accounts.find((acc) => String(acc.id) === selectedAccountId) ??
        accounts[0] ??
        null;

  useEffect(() => {
    if (storeCode) {
      // Fetch the store's connected accounts for this channel.
      dispatch(fetchMetaPages({ storeCode, channelType }));
    }
  }, [storeCode, channelType, dispatch]);

    useEffect(() => {
        if (storeCode) {
            // Backend has no per-account scoping for posts — this fetches every
            // post for the channel, regardless of which account is selected.
            dispatch(fetchSocialPosts({ storeCode, channelType }));
        }
    }, [storeCode, channelType, dispatch]);

  const rows = useMemo(
    () =>
      (FetchSocialPostsData?.results ?? []).filter(
        (post) => post.channel_type === channelType,
      ),
    [FetchSocialPostsData, channelType],
  );

  const account: AccountIdentity = selectedAccount
    ? {
        name: selectedAccount.name || channel.accountFallback.name,
        username: selectedAccount.username || "",
        profilePictureUrl: selectedAccount.profile_picture_url || "",
      }
    : channel.accountFallback;

  const postsLoading = FetchSocialPostsIsLoading || FetchMetaPagesIsLoading;

  return (
    <ChannelContext.Provider value={channel}>
      <AccountContext.Provider value={account}>
        <div className="px-4">
          <div className="flex flex-col items-center gap-4 w-full md:grid md:grid-cols-3 md:items-start">
            <div className="sticky top-2 z-10 flex flex-col gap-4 w-full justify-end items-end">
              <AccountCard
                loading={FetchMetaPagesIsLoading}
                accounts={accounts}
                selectedAccount={selectedAccount}
                onSelectAccount={setSelectedAccountId}
              />
            </div>
            <div className="flex flex-col items-center gap-6 w-full md:col-span-2 md:items-start">
              {postsLoading ? (
                <>
                  <SocialPostSkeleton />
                  <SocialPostSkeleton />
                </>
              ) : rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No posts yet.</p>
              ) : (
                rows.map((post: SocialPost) => (
                  <SocialPostCard key={post.external_id} post={post} />
                ))
              )}
            </div>
          </div>
        </div>
      </AccountContext.Provider>
    </ChannelContext.Provider>
  );
}
