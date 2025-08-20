from gtts import gTTS
import os

# Create audio folder if not exists
if not os.path.exists("audio"):
    os.makedirs("audio")

# Loop through stories and convert to audio
for filename in os.listdir("stories"):
    if filename.endswith(".txt"):
        story_path = os.path.join("stories", filename)
        with open(story_path, "r", encoding="utf-8") as f:
            text = f.read()
        
        tts = gTTS(text)
        mp3_filename = filename.replace(".txt", ".mp3")
        tts.save(os.path.join("audio", mp3_filename))
        print(f"Generated {mp3_filename}")
