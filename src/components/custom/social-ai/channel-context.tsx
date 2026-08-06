"use client";

import {
  IconHeart,
  IconHeartFilled,
  IconThumbUp,
  IconThumbUpFilled,
} from "@tabler/icons-react";
import { createContext, useContext } from "react";

export type SocialChannel = "facebook" | "instagram";

// The page identity shown on post headers and the reply box — derived from
// the selected connected account, with a placeholder until pages load.
export type AccountIdentity = {
  name: string;
  username: string;
  profilePictureUrl: string;
};

// Per-channel wording and icons — everything channel-specific lives here so
// the shared components stay channel-agnostic.
export type ChannelConfig = {
  key: SocialChannel;
  label: string;
  accountFallback: AccountIdentity;
  userFallback: string;
  LikeIcon: typeof IconThumbUp;
  LikeIconFilled: typeof IconThumbUp;
  // Brand color the like icon fills with once liked — Facebook blue vs
  // Instagram's heart red.
  likeColorClass: string;
};

export const CHANNELS: Record<SocialChannel, ChannelConfig> = {
  facebook: {
    key: "facebook",
    label: "Facebook",
    accountFallback: {
      name: "Facebook Page",
      username: "",
      profilePictureUrl: "",
    },
    userFallback: "Facebook user",
    LikeIcon: IconThumbUp,
    LikeIconFilled: IconThumbUpFilled,
    likeColorClass: "text-[#1877F2]",
  },
  instagram: {
    key: "instagram",
    label: "Instagram",
    accountFallback: {
      name: "Instagram Account",
      username: "",
      profilePictureUrl: "",
    },
    userFallback: "Instagram user",
    LikeIcon: IconHeart,
    LikeIconFilled: IconHeartFilled,
    likeColorClass: "text-[#ED4956]",
  },
};

export const ChannelContext = createContext<ChannelConfig>(CHANNELS.facebook);

export const AccountContext = createContext<AccountIdentity>(
  CHANNELS.facebook.accountFallback,
);

export function useChannel() {
  return useContext(ChannelContext);
}

export function useAccountIdentity() {
  return useContext(AccountContext);
}
