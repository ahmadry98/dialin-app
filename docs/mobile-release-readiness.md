# Mobile Release Readiness

DialedIn mobile is the customer-facing iOS/Android app. DialChat is the AI shot analysis flow inside it.

## Current release stance

- Development cloud API: `http://api-dev.dialedin.me`
- Production API: `https://api.dialedin.me` once production DNS, HTTPS, and infrastructure are ready
- Media flow: photos/videos are selected on device, recognition photos are resized/compressed before `/chat`, shot videos are compressed by the picker where possible, uploaded through backend presigned URLs, then analyzed by DialChat
- Maximum shot video length: 80 seconds

## Privacy Notes

DialedIn uses selected photos and videos only for espresso equipment recognition, shot timing, and grind recommendations. Users should avoid uploading private background content. Shot videos may include audio because the app estimates pump timing from the espresso machine sound.

## Preflight Checklist

- [ ] API URL points to the intended environment.
- [ ] `/health`, `/machines`, and `/grinders` work from the phone network.
- [x] Photo attachment is resized/compressed before recognition and shows an inline preview/result.
- [ ] Video attachment uploads, shows inline preview, and returns timing/recommendation.
- [ ] Videos over 80 seconds are rejected with a clear message.
- [ ] Low-confidence timing asks the user to confirm timing.
- [ ] Machine and grinder pages load cloud DynamoDB data.
- [ ] App icons, splash screen, and screenshots are final before App Store / Play Store submission.
- [ ] Production API uses HTTPS before public store release.

## Store Permission Copy

- Photo library: used to select espresso machine photos, grinder photos, and shot videos.
- Video audio: selected shot videos may include audio, and DialChat uses that audio to estimate espresso machine timing.
- Camera: not requested yet. Add this only when in-app capture is implemented.
