# Entity Order

**This Foundry VTT module is now deprecated.**

This module was previously used to re-order entities (Actors, Scenes, Items and Journal entries) as well as folders. It also allowed you to sort entities in a folders alphabetically.

Most of its functionality has now been integrated into the core features of FVTT, and the 'sort folder' feature was moved into the [Furnace](https://github.com/kakaroto/fvtt-module-furnace) module.

This module continues to exist only so it can migrate the entities' order value from the module flags into the core database.

# Installation
In the setup screen, use the URL `https://raw.githubusercontent.com/kakaroto/fvtt-module-entityorder/master/module.json` to install the module.

As DM go to the `Manage Modules` options menu in your World then enable the `Entity Order` module.


# Using it

The first time you open your world, this module will convert the saved entity order from its own settings into the core sort order which can take quite a long time as every entity would need to be updated. Please be patient while that happens as it will slow down your FVTT until it finishes the migration process.

After it is done, the module can be disabled as it has no other uses anymore.

# License
This Foundry VTT module, writen by KaKaRoTo, is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development v 0.1.6](http://foundryvtt.com/pages/license.html).