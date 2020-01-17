class EntityOrder {
	// Use the new 'sort' field for all entities that was introduced in 0.3.9
	static migrateToCoreSort(entity) {
		let order = entity.getFlag("entityorder", "order")
		if (order !== undefined && order !== null) {
			return {_id: entity.id, sort: Math.floor(order), "flags.entityorder.-=order": null }
		}
		return null
	}
	static async migrateCollection(collection) {
		let updateData = collection.entities.map(this.migrateToCoreSort).filter(u => u !== null);
		if (updateData.length > 0)
			return CONFIG[collection.entity].entityClass.updateMany(updateData);
		return false;
	}
	static async migrate() {
		await EntityOrder.migrateCollection(game.journal);
		await EntityOrder.migrateCollection(game.scenes);
		await EntityOrder.migrateCollection(game.actors);
		await EntityOrder.migrateCollection(game.items);
		// Disabling self
		let modules = game.settings.get('core', 'moduleConfiguration');
		modules.entityorder = false;
		game.settings.set('core', 'moduleConfiguration', modules);
	}
}

Hooks.on('ready', EntityOrder.migrate);