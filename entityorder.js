class EntityOrder {

	// Apparently that's how we do consts inside classes...
	static get ORDER_MUL() {
		return 100000;
	}

	static getEntityFolderContext(html, options) {
		options.push({
			name: "Sort Alphabetically (Ascending)",
			icon: '<i class="fas fa-sort-alpha-down"></i>',
			condition: game.user.isGM,
			callback: header => EntityOrder.sortEntities(header, true)
		})
		options.push({
			name: "Sort Alphabetically (Descending)",
			icon: '<i class="fas fa-sort-alpha-down-alt"></i>',
			condition: game.user.isGM,
			callback: header => EntityOrder.sortEntities(header, false)
		})
	}


	// Re-order the entire list based on their position.
	static async sortEntities(header, ascending) {
		let folderId = header.parent().attr("data-folder-id");
		let folder = game.folders.get(folderId);
		let entities = folder.content;

		// Reset order values according to the new order within this folder
		// This won't affect the order with the other folders and the whole collection
		// order will be reset on the next render
		entities.sort((a, b) => a.data.name.localeCompare(b.data.name) * (ascending ? 1 : -1))
		for (let i = 0; i < entities.length; i++) {
			let order = i * EntityOrder.ORDER_MUL;
			await entities[i].update({ sort: order });
		}
	}

	// Use the new 'sort' field for all entities that was introduced in 0.3.9
	static migrateToCoreSort(entity) {
		let order = entity.getFlag("entityorder", "order")
		if (order !== undefined && order !== null) {
			if (EntityOrder.migratingWarning !== true) {
				// Show warning if we find that we need to migrate stuff.
				// This can take quite a while since most probably every entity needs a database upgrade.
				// Show the warning every 5 seconds until we stop migrating.
				EntityOrder.migratingWarning = true;
				console.warn("Migrating sort order from module to core sort key")
				ui.notifications.warn("EntityOrder: Migrating sort order from module to core sort key.<p>Please be patient as this may take a while... This message will disappear when the migration is done.</p>")
				setTimeout(() => EntityOrder.migratingWarning = false, 5000)
			}
			return entity.update({ sort: Math.floor(order), "flags.entityorder.-=order": null })
		}
		return Promise.resolve(entity);
	}
	static async migrate() {
		let all_entities = game.journal.entities.concat(game.scenes.entities).concat(game.actors.entities).concat(game.items.entities)
		for (let entity of all_entities)
			await EntityOrder.migrateToCoreSort(entity).catch(() => { });
	}
}

Hooks.on('ready', EntityOrder.migrate)
/* Add sort alphabetically option */
Hooks.on('getJournalDirectoryFolderContext', EntityOrder.getEntityFolderContext);
Hooks.on('getSceneDirectoryFolderContext', EntityOrder.getEntityFolderContext);
Hooks.on('getActorDirectoryFolderContext', EntityOrder.getEntityFolderContext);
Hooks.on('getItemDirectoryFolderContext', EntityOrder.getEntityFolderContext);
