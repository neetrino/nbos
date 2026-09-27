# 07 — Duration guard decisions

**Status:** accepted 2026-09-27. Not implemented. Do not reopen these choices during implementation.

Owner decisions for the live meeting and its recording. Ordinary meetings last about 30 minutes, sometimes 2 hours, rarely 3. The guard exists so a forgotten room cannot run for days.

## 1. Continuation guard covers the meeting and the recording

The prompt is about the live meeting. Recording does not get a separate question.

- Show it to every NBOS member who is in the call. One click from any of them is enough. The person who started the recording is not special.
- Guests do not see the button or the countdown.
- One button: **Continue**, plus a 10-minute countdown.
- The clock is the current live session, from the moment the meeting is live. A durable room that later returns to idle starts this clock again on the next live session. It is not the age of the meeting card.
- First warning at **0:50**. If someone continues, stay quiet until **1:50**. If they continue again, the next warning is **2:50**. After that, the same step: a continue click covers until 10 minutes before the next full hour.
- For the first 8 minutes the countdown stays out of the way. For the **last 2 minutes** the same button moves to the center of the screen and blocks the call. It is meant to be seen and pressed.
- If nobody clicks and the countdown reaches zero, **end the meeting** for everyone, including guests.
- If a recording is running, stop it as part of that same end. If no recording is running, only the meeting ends.
- Persist who continued and when, so the next warning knows to stay quiet.

| Warning opens | No click: meeting ends | Click: next warning |
| ------------- | ---------------------- | ------------------- |
| 0:50          | 1:00                   | 1:50                |
| 1:50          | 2:00                   | 2:50                |
| 2:50          | 3:00                   | 3:50                |
| 3:50          | 4:00                   | 4:50                |

The row continues for as long as people keep pressing Continue. There is no silent week-long meeting.

## 2. One recording file until 3 hours

Do not cut a recording that is still under 3 hours. Most meetings never get a second file.

A second file starts only when **all** of these are true:

1. This recording file has reached 3 hours.
2. The team already pressed Continue, so the meeting is allowed to keep going. If the countdown at that checkpoint expires with no click, end the meeting and do not start another file.

The handoff:

1. Stop the current egress Chrome and let it close the local file. This is seconds, not the R2 upload.
2. Start the next recording Chrome as soon as that job has released the machine.
3. Upload the closed file to R2 in the background, beside the new recording. Do not wait for the upload before starting the next file.
4. Do not run two room-composite Chromes at once. This server has 4 cores. Egress prices one room composite at 4, and while any egress job is still alive a new composite is admitted only against 80% of the cores (3.2). A second composite does not fit until the first job has exited. LiveKit's own S3 upload keeps that job alive, so the upload has to be ours, after the file is closed locally.

The call stays up during the handoff. The recording has a gap of about **10–20 seconds**. On screen, for the team, say that this takes **about 20 seconds**. Show that state as waiting until the new recording is actually running, then show that recording continues. Do not flip to "continues" on a timer.

If a later file also reaches 3 hours and the meeting is still continued, roll again the same way. Each file is at most 3 hours.

The file clock is recording time, not the meeting clock. A recording started late does not roll at the meeting's 3-hour mark; it rolls when **that file** reaches 3 hours, and only if the meeting was continued.

## 3. Recording follows the meeting, not the person who pressed Record

While the meeting stays live, the recording keeps going. It does not matter who started it.

- A teammate who leaves, including the person who started the recording, does not stop the recording if another teammate is still in the call.
- Guests leaving does not stop it either.
- The last teammate does not merely leave. Their button **ends the meeting**. That end stops the recording, even if nobody pressed a separate stop.
- While any teammate is still in the call, the button is leave, not end. Guests never get an end button.
- Only this explicit last-teammate end, and the continuation guard in §1, stop the meeting. A dropped connection is not an end.
- Any teammate from our side who is in this live meeting can **start** recording and can **stop** it. Not only the host, the owner, or the person who created the meeting. The host can leave, and someone else who stayed can still start it.
- Guests cannot start or stop recording.
- Stopping the recording saves the file and leaves the meeting up. That is separate from the last teammate ending the call.
- A start does not wait for per-participant consent. Anyone on our side who is in the call may press the button.
- Today start and stop call `requireHostOrOwner`, and the call UI shows the control only when `canManage` (host plus `VIDEO_MEETINGS` edit). That host-only check is wrong for recording and must not stay. Admission and other host actions stay host-only.

## 4. Office internet can die; the recording must still be saved

Egress runs on the server. If the office network dies and every client disappears, the live room and the recording stay up and wait for our side to reconnect. They do not stop because the sockets closed.

- A participant who vanishes without pressing leave or end is treated as a dropped connection: crash, laptop, office internet. The meeting stays live. The recording stays running.
- The same wait applies when the room becomes empty and when only guests remain. Guests cannot click Continue, so they do not keep the meeting alive past the guard.
- The continuation guard is the timeout for that wait. If nobody from our side is back to press Continue, the countdown reaches zero, the meeting ends, and the recording is finalized and uploaded.
- An explicit leave is different. When every teammate has pressed leave, the last of those presses ends the meeting and the recording immediately. The system does not wait for an hourly check.
- Today LiveKit `emptyTimeout` is 600 seconds, and a `room_finished` from that timeout would stop the recording. That is shorter than the guard and must not win. An empty room stays open until the guard or an explicit end closes it. People rejoin the same live meeting.
- Every real stop (last teammate, or the guard) finalizes the file and uploads it to R2 before cleanup. A recording is not discarded because the clients are already gone. The local copy is still deleted only after §5 verifies the object.

If the recording server itself dies before the file is closed, that open file cannot be promised. An office outage is not that case: the server still has the room and keeps writing.

## 5. Delete the local copy only after R2 has the file

Egress v1.14.1 uploads the MP4 and leaves the local file in its temp directory (`deleteAfterUpload` is false in the file sink). That copy sits on the same SSD as LiveKit.

- Mount the egress temp directory on a known host path so cleanup can see the files.
- Delete a local file only after HeadObject on R2 shows the object exists and its size is greater than zero.
- Then check that the local file is gone.
- If the object is missing, empty, or the delete fails, cleanup is not done. Retry. Do not delete the only copy.

## Rejected

- A silent 2-hour cap that kicks people out of the call with no button.
- A prompt that stops only the recording and leaves the meeting up.
- Asking only the person who started the recording.
- Showing the continue button to guests.
- Cutting every recording at 2 hours, or cutting any file before 3 hours.
- Starting the next Chrome while the previous Chrome is still encoding or still inside its own upload.
- Treating the R2 upload time as part of the on-screen gap. The gap is the file close plus the next Chrome start, about 20 seconds.
- Stopping the recording because the person who started it left, or because a teammate left while others remain.
- Letting only the host or the meeting owner start or stop the recording.
- Treating a network drop, a closed laptop, or an empty room as an intentional end.
- Letting the 10-minute empty-room timeout stop a recording that the continuation guard has not ended yet.
