# 🌾 Smart Farm PBL Studio

Part of the **Smart Farm workshop kit** for the Africa-UniNet project *Developing AI Competency for Sustainability in Ethiopia and Tanzania* (smart agriculture).

A one-day **project-based learning** path built on **design thinking**, where student teams go from a farmer's real problem to a tested AI prototype.

**Driving question:** *How might we help smallholder farmers in our region use real-time sensor data and AI to make better decisions about water, crops and climate risk?*

| # | Phase | Time | Team deliverable |
|---|---|---|---|
| 1 | 🚀 Launch (PBL entry event) | 09:00, 30 min | roles, need-to-know list, team agreement |
| 2 | 👩🏾‍🌾 Empathise | 09:30, 60 min | farmer persona and decision map |
| 3 | 🎯 Define | 10:45, 45 min | point-of-view statement, How Might We, success criteria |
| 4 | 📡 Explore the data | 11:30, 45 min | decision-to-data map, data ethics rules |
| 5 | 💡 Ideate | 13:15, 45 min | dot-voted ideas, chosen idea and AI approach |
| 6 | 🛠️ Prototype | 14:00, 75 min | conversation design, adapted advice rules, working link |
| 7 | 🧪 Test | 15:30, 45 min | feedback grid and one improvement |
| 8 | 🎤 Pitch & reflect | 16:15, 45 min | 3-minute pitch, AI competency self-assessment |

Each phase page has the goal, activities, links to the other workshop apps, and a **team canvas** that saves automatically in the browser. Teams can download a **Markdown report**, save and load a **.json team file**, or **print to PDF**. The **facilitator view** shows the agenda, a phase timer, and team progress.

The self-assessment follows the four dimensions of the UNESCO *AI competency framework for students* (2024): human-centred mindset, ethics of AI, AI techniques and applications, and AI system design.

## Run and deploy

Static site, no build step:

```bash
python -m http.server 8000
```

Deploy by importing the repo in Vercel.

## Adapt the day

Everything is in [`phases.js`](phases.js): the driving question, the agenda times, each phase's activities and the canvas fields. Field types are `text`, `textarea`, `list`, `table`, `vote` and `rating`. For example, to add a 2-hour 3D generative AI session, add an agenda line:

```js
{ time: "14:00", min: 120, label: "Guest workshop: 3D generative AI" },
```

Update the app links in `apps` after deploying the chatbot and the twin.

## Workshop kit

| Repo | What it does |
|---|---|
| `smart-farm-pbl-studio` | this workshop path |
| `smart-farm-sensors` | simulator, data logger and ESP32 firmware (MQTT) |
| `smart-farm-chatbot` | farmer advisory chatbot, English and Swahili, Claude + rules |
| `smart-farm-twin` | 3D digital twin of the plot with VR |

## License

MIT. See [LICENSE](LICENSE).
