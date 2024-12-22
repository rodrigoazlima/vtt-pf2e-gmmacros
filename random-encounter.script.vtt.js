// Configuration
const randomEncounter = {};

randomEncounter.config = {
    terrain: "Forest",
    onRoadOrRiver: false,
    flying: false,
    minutesPerSquare: 111
}
randomEncounter.terrains = {
    "Aquatic": 17,
    "Arctic": 17,
    "Desert": 17,
    "Forest": 14,
    "Mountain": 16,
    "Plains": 12,
    "Swamp": 14
};
randomEncounter.roadOrRiverBonus = -2;
randomEncounter.flyingBonus = 3;
randomEncounter.encounterTypes = ['Harmless', 'Hazard', 'Creature'];

randomEncounter.calculateDC = function (terrain) {
    let dc = randomEncounter.terrains[terrain]
        + (randomEncounter.config.onRoadOrRiver ? roadOrRiverBonus : 0)
        + (randomEncounter.config.flying ? randomEncounter.flyingBonus : 0);
    return dc;
}

randomEncounter.rollFlatCheck = function (dc) {
    return new Promise((resolve, reject) => {
        new Roll('1d20').evaluate().then(roll => {
            if (roll.total >= dc) {
                resolve(roll.total);
            } else {
                reject("No encounter.");
            }
        }).catch(reject);
    });
}
randomEncounter.rollEncounterType = function () {
    return new Promise((resolve, reject) => {
        new Roll('1d10').evaluate().then(roll => {
            let encounterType = '';
            if (roll.total <= 5) {
                encounterType = 'Harmless'
            } else if (roll.total <= 7) {
                encounterType = 'Hazard'
            } else {
                encounterType = 'Creature'
            }
            resolve({ type: encounterType, roll: roll.total });
        }).catch(reject);
    });
}
randomEncounter.logEncounter = function (encounters, rollResult, dc, hasCreature) {
    let result = `
      <b>New encounter!</b> (Roll  ${rollResult} / DC ${dc})<br>
      - Terrain: ${randomEncounter.config.terrain} (DC ${randomEncounter.terrains[randomEncounter.config.terrain]})<br>
      - Flying: ${randomEncounter.config.flying ? "Yes" : "No"} DC +3 <br>
      - On Road/River: ${randomEncounter.config.onRoadOrRiver ? "Yes" : "No"} DC -2 <br>
  
      <b>Encounter(s):</b><br>
    `;

    encounters.forEach((encounter, index) => {
        result += `\n  Encounter ${index + 1}: ${encounter.type} (Roll: ${encounter.roll})`;
    });

    if (hasCreature) {
        result += "<br><i>Roll Perception!</i>";
        if (!game.data.paused) {
            game.togglePause()
        }
    }
    return new Promise((resolve) => {
        ChatMessage.create({
            user: game.user.id,
            content: result,
        }).then(resolve);
    });
}
randomEncounter.handleEncounter = async function () {
    try {
        const dc = randomEncounter.calculateDC(randomEncounter.config.terrain);
        const rollResult = await randomEncounter.rollFlatCheck(dc);
        const encounterSize = (rollResult >= dc + 10 || rollResult == 20) ? 2 : 1;
        let hasCreature = false;
        const encounterPromises = new Array(encounterSize);
        for (let i = 0; i < encounterSize; i++) {
            const encounterResult = await randomEncounter.rollEncounterType();
            if (encounterResult.type === 'Creature') {
                hasCreature = true;
            }
            encounterPromises[i] = encounterResult;
        }

        const encounterResults = await Promise.all(encounterPromises);

        await randomEncounter.logEncounter(encounterResults, rollResult, dc, hasCreature);
    } catch (error) {
        console.log(error);
        await ChatMessage.create({
            user: game.user.id,
            content: error,
        });
    }
}

randomEncounter.updateTime = function () {
    let currentTimestamp = SimpleCalendar.api.timestamp();
    let interval = { minute: randomEncounter.config.minutesPerSquare };
    let newTimestamp = SimpleCalendar.api.timestampPlusInterval(currentTimestamp, interval);
    let newDate = SimpleCalendar.api.timestampToDate(newTimestamp);
    let result = SimpleCalendar.api.setDate(newDate);

    ChatMessage.create({
        user: game.user.id,
        content: `${randomEncounter.config.minutesPerSquare} minutes has passed. `,
    });
}

// Run the encounter handler
randomEncounter.handleEncounter();
randomEncounter.updateTime();