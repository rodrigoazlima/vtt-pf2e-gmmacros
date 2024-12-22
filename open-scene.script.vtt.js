const sceneUUID = "Scene.4Dm4yFYL5QSFKGDp";
fromUuid(sceneUUID).then(scene => {
    if (scene instanceof Scene) {
        // Activate the scene
        scene.activate();
        console.log(`Scene with UUID "${sceneUUID}" has been activated.`);
    } else {
        console.error(`No valid scene found for UUID "${sceneUUID}".`);
    }
}).catch(err => {
    console.error(`Error fetching scene with UUID "${sceneUUID}":`, err);
});