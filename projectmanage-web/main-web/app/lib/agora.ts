// app/lib/agora.ts
export async function joinVoice({
  appId,
  channelName,
  token,
  uid,
}: {
  appId: string;
  channelName: string;
  token?: string | null;
  uid?: string | number | null;
}) {
  // dynamic import เพื่อเลี่ยง SSR import time
  const Agora = await import("agora-rtc-sdk-ng");
  const AgoraRTC = Agora.default;

  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  await client.join(appId, channelName, token ?? null, uid ?? null);

  const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([micTrack]); // สำคัญ! ต้อง publish ไม่งั้นคนอื่นจะไม่ได้ยิน/มองไม่เห็น

  return { client, micTrack };
}