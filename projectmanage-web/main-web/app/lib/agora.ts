import type { IAgoraRTCClient, ILocalAudioTrack } from "agora-rtc-sdk-ng";

export async function getAgora() {
  const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
  return AgoraRTC;
}

export type VoiceJoinParams = {
  appId: string;
  channelName: string;
  token: string;
  uid: string;
};

export async function joinVoice({
  appId, channelName, token, uid,
}: VoiceJoinParams) {
  const AgoraRTC = await getAgora();
  const client: IAgoraRTCClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  await client.join(appId, channelName, token, uid);

  const micTrack: ILocalAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([micTrack]);

  return { client, micTrack };
}