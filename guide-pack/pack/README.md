# Aion 2 Leveling Guide Builder

This pack lets Claude build you a personal, interactive Aion 2 leveling guide for your class and faction. It quizzes you about your character first, then researches and builds a web app with checklists, level stop points, a skill-point plan and a rotation card.

## What's in the zip

| File | What it is |
|---|---|
| `README.md` | This setup guide. |
| `aion2-guide-prompt-pack.md` | The prompt you paste into Claude. |
| `aion2-route-template.html` | A finished example guide (Asmodian Assassin). Claude uses it as the layout reference. You can also open it in a browser to see what you'll get. |
| `icons/` | Item icons already collected, named after their item: `enhance-stone.png`, `wisdom-stone.png`, `daevanion-crystal.png`. Add new ones here as you save them. |

## Setup (about 5 minutes)

1. **Unzip** the pack somewhere you can find it.
2. **Open Claude** at claude.ai or in the Claude app, and start a new chat.
3. **Turn on web search** if it isn't already. Claude needs it to look up quests, skills and unlock levels.
4. **Attach the template and icons:** drag `aion2-route-template.html` and every file in the `icons/` folder into the chat, or use the paperclip/attach button.
5. **Paste the prompt:** open `aion2-guide-prompt-pack.md` in any text editor, copy everything below the line **PROMPT STARTS HERE**, and paste it into the same message as the attachment. Send it.
6. **Answer the quiz.** Claude asks about your faction, class, level, current main quest, goals and what you've already done. You can skip the last two rounds.
7. **Wait for the build.** Claude researches your class and faction, then publishes the guide as an artifact you can open from the chat.

## Using your guide

- **Open it in a browser:** the guide is a private link while you're signed in to Claude. Ask Claude "give me the link" if you need it. Use the Share menu on the page to share it with anyone else.
- **Keep your place:** type your current main quest in "Where you are"; it sets your level and the next stop point. Or drag the level slider.
- **Stop points:** when you reach a stop point's level, pause the story and clear its list. Missed ones turn amber.
- **Skill points:** the card at the top shows the one thing to buy next and your current rotation.
- **Tooltips:** tap any small "i" for a plain-language explanation of a game term.
- **Progress** saves in the browser you use. Ticks on your PC won't appear on your phone.

## Item icons

The guide links every item name to its database page. The `icons/` folder already has three icons; attach them at setup and Claude puts them in your guide. For more:

1. Claude gives you links to the item pages.
2. On each page, right-click the item icon and choose **Save image as…** Name the file after the item (e.g. `hidden-cube-key.png`) and keep it in `icons/`.
3. Attach the files in the chat. Claude uploads them into your guide.

Do this gradually during check-ins, as new items come up.

## Check-ins

Every so often, tell Claude your current main quest (or level). It will tell you what's next, what you may have missed, and which icons to grab. Screenshots of the game help; Claude can read them.

## Keeping it accurate

- Tell Claude when something doesn't match the game ("extraction isn't unlocked yet at 8", "that quest doesn't exist"). It will re-check a source and update the same guide.
- Tell Claude your new level or quest anytime and ask it to update.
- The Confidence panel at the bottom of the guide shows what's cross-checked, single-sourced or unknown. Treat single-sourced items as likely but not certain.

## Known limits

- Guides for the Global client are new. Skill names and numbers can change with patches.
- Level 40–45 route data was hard to find. Claude will say so if it can't cover that stretch.
- If you're on the same faction and class as the template (Asmodian Assassin), you can just open the template and use it directly, but it was set up for one player's progress.
