// priority: 0
// Item description tooltips (migrated from jei-descriptions.js)
// These display as additional tooltip lines on the item, visible in-game and in EMI.

ItemEvents.tooltip(event => {

    event.add('supplementaries:planter', [
        '§7Used for growing crops without a water source block.',
        '§7Now you can grow them even in the nether and you won\'t have to worry about animals trampling your crops!'
    ])

    event.add('supplementaries:faucet', [
        '§7When turned on, it starts spilling on the ground the inventory of up to two blocks behind it. If you place it in front of a water block (cauldron, water/waterlogged), it will start dripping water particles.',
        '§7You can use it to pour liquids to and from jars. Since it can extract items from the side of a block it enables some sort of automation not possible with vanilla.',
        '§7It will also interact with other blocks like hives and concrete powder. Its water color will depend on what\'s behind it.'
    ])

    event.add('supplementaries:jar', [
        '§7Stores 4 buckets or 12 bottles of any vanilla liquids (like honey, milk, lava, potions, soups, dragon breath or xp) as well as fireflies. It functions as a shulker box for liquids or a rudimentary tank. You can now also store cookies and fish! Not compatible with the forge fluid system or with other fluid mods, meant to complement vanilla only.'
    ])

    event.add('supplementaries:wind_vane', [
        '§7Emits a redstone signal, depending on the weather. The worse the weather, the stronger the signal.'
    ])

    event.add('supplementaries:pedestal', [
        '§7Place an item on top to have it displayed. Stacking multiple pedestals will turn them into a pillar.'
    ])

    event.add('supplementaries:redstone_illuminator', [
        '§7Light source that can be switched off with a redstone signal.'
    ])

    event.add('supplementaries:crank', [
        '§7Outputs a redstone signal that gets stronger the more the crank is rotated.'
    ])

    event.add('supplementaries:spring_launcher', [
        '§7Launches any entity on top of it when it is given a redstone signal.'
    ])

    event.add('supplementaries:turn_table', [
        '§7When powered, will rotate any item/entity on top of it.'
    ])

    event.add('supplementaries:clock_block', [
        '§7Right click on the block to get the time in hours. You are able to sleep at 18:00 and Dawn is at 06:00.'
    ])

    event.add('supplementaries:bellows', [
        '§7When powered, will blow entities or items in front of it in the direction it is facing.'
    ])

    event.add('supplementaries:cog_block', [
        '§7Transmits redstone power, just like redstone dust, but connects on all sides.',
        '§7This makes vertical redstone easier and looks cooler too.'
    ])

    event.add('supplementaries:safe', [
        '§7Extremely hard block that functions as a chest. Retains inventory when broken.'
    ])

    event.add('supplementaries:hourglass', [
        '§7Place sand in it and it will provide a redstone signal until the sand runs out. Flip and repeat.'
    ])

    event.add('kubejs:upgrade_swift2', [
        '§7Can be found in Raid Dungeon as Stage 5 loot.'
    ])

    event.add('kubejs:upgrade_sharp2', [
        '§7Can be found in Raid Dungeon as Stage 5 loot.'
    ])

})
