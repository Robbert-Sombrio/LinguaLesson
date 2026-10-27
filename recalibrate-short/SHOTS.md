# Recalibrate Short: 4 platform versions (YouTube 35.0 s, TikTok 35.5 s, Instagram 36.0 s, LinkedIn 37.1 s)

| Time | Scene | Line (Sean) |
|---|---|---|
| 0–10.45 | hook.html | "Change one word in your next email and watch how people respond differently. The word is recalibrate. re-CAL-ih-brate. Stress on the second syllable." |
| 10.45–23.35 | swap.html | "You wrote: 'We need to change our approach after Q3.' Now swap one word: 'We need to recalibrate our approach after Q3.' Same meaning, completely different signal." |
| 23.35–30.1 | compare.html | "Change sounds reactive. Recalibrate sounds deliberate. Not panicking. Adjusting." |
| 30.1–end | endcard.html | Platform CTA (variables set by scripts/build_index.py) |

Cut from the take: "Fine. Safe. Forgettable." and "It implies you have instruments, you have data, you're making a precise adjustment," (both remain as on-screen tags).
Rebuild: python3 scripts/make_voice.py <tmpdir>; transcribe each voice-<platform>.wav to assets/audio/words-<platform>.json; scripts/make_captions.py; scripts/make_srt.py <platform>; scripts/make_bed.py ... ; scripts/build_index.py <platform>; render.
