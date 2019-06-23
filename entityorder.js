var pendingRender = false
function ensureOrder(entity) {
    let order = entity.getFlag("entityorder", "order");
    if (order === undefined) {
	entity.setFlag("entityorder", "order", entity.collection.entities.indexOf(entity))
    }
}
function sortEntities(a, b) {
    let order_a = a.getFlag("entityorder", "order");
    let order_b = b.getFlag("entityorder", "order");
    return order_a - order_b;
}

function cleanFolderName(folder) {
    folder.name = folder.name.replace(/^•[0-9]+•/, "")
    folder.children.forEach(cleanFolderName)
}

Folder._entityorder_original_setupFolders = Folder.setupFolders;
Folder.setupFolders = function(entityType, entities) {
    entities.forEach(ensureOrder)
    sorted_entities = entities.sort(sortEntities)
    let [tree, root_entities] = this._entityorder_original_setupFolders(entityType, sorted_entities);
    tree.forEach(cleanFolderName)
    return [tree, root_entities]
}

SidebarDirectory.prototype._entityorder_original_handleDropData = SidebarDirectory.prototype._handleDropData;
SidebarDirectory.prototype._handleDropData = function(event, data) {
    let before = $(event.target).closest(".directory-item");
    let after = $(event.target).next(".directory-item");
    let ent = this.constructor.collection.get(data.id);
    // ent.setFlag("entityorder", "order", (before + after) / 2 )

    folder = $(event.target).closest(".folder");
    if ( folder.length > 0 ) {
	folder_id = folder.attr("data-folder-id");
    } else {
	folder_id = null;
    }
    var new_order = ""
    if (before.length != 0 && after.length == 0) {
	after = before.next(".directory-item")
    }
    if (before.length == 0 && after.length == 0) {
	children = folder.find(".directory-item")
	// Added to the beginning
	if (children.length == 0) {
	    new_order = 0
	} else {
	    before = $(children[0])
	    let before_ent = this.constructor.collection.get(before.attr("data-entity-id"))
	    new_order = before_ent.getFlag("entityorder", "order") -1
	}
    } else if (before.length != 0 && after.length == 0) {
	let before_ent = this.constructor.collection.get(before.attr("data-entity-id"))
	
	// Added to the end
	new_order = before_ent.getFlag("entityorder", "order") + 1
    } else {
	let before_ent = this.constructor.collection.get(before.attr("data-entity-id"))
	let after_ent = this.constructor.collection.get(after.attr("data-entity-id"))
	
	// Added in between
	new_order = (before_ent.getFlag("entityorder", "order") + after_ent.getFlag("entityorder", "order")) / 2
    }
    //console.log("New order = ", new_order)
    ent.setFlag("entityorder", "order", new_order);
    if (ent.data.folder != folder_id) {
	//console.log("Folder is going to get updated from ", ent.data.folder, " to " , folder_id);
	//ent.setFlag("entityorder", "order", "");
    } else {
	pendingRender = true
    }
    return this._entityorder_original_handleDropData(event, data)
}

function entityUpdated(obj) {
    if (pendingRender) {
	obj.collection.render()
    }
    pendingRender = false
}

Hooks.on('updateJournalEntry', entityUpdated)
Hooks.on('updateScene', entityUpdated)
Hooks.on('updateActor', entityUpdated)
Hooks.on('updateItem', entityUpdated)
