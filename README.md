# Entity Order

This Foundry VTT module allows you to re-order entities (Actors, Scenes, Items and Journal entries) as well as folders if you are on version of FVTT prior to 0.3.9, otherwise, it will let you sort entities in a folders alphabetically.

# Installation
In the setup screen, use the URL `https://raw.githubusercontent.com/kakaroto/fvtt-module-entityorder/master/entityorder/module.json` to install the module.

As DM go to the `Manage Modules` options menu in your World then enable the `Entity Order` module.


# Using it

If you are using FVTT 0.3.8 or earlier :

Just drag and drop your entities and they should get placed wherever you drop them. To place one at the top of a folder, drop it onto the folder name itself. An entity will always be placed after the entity you drop it onto.

To re-order your folders, drop them anywhere in the sidebar and they will be placed **after** the folder that they were placed into. If you want to move a folder inside of another, then you need to drop it on top of another subfolder within that parent.

Starting from FVTT 0.3.9, entity ordering is part of the core features, so this module has become obsolete. It will still let you sort folder contents alphabetically via the context menu, but this small QoL feature will be integrated into Furnace and this module will become deprecated.

If you use 0.3.9 or up, the first time you open your world, this module will convert the saved entity order from its own settings into the core sort order which can take quite a long time as every entity would need to be updated. Please be patient while that happens as it will slow down your FVTT until it finishes the migration process.

# License
This Foundry VTT module, writen by KaKaRoTo, is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development v 0.1.6](http://foundryvtt.com/pages/license.html).