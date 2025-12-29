#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import { DATA } from './data/db.js';
import { searchPlayers, getPlayerStats } from './blizzard.js';
import type { Hero, Item, Power } from './data/types.js';

// Setup CLI
const program = new Command();

program
  .name('athena')
  .description('Athena API CLI - Overwatch Data & Stats')
  .version('1.0.0');

// Helper to format output
const format = (obj: any) => JSON.stringify(obj, null, 2);

// --- Commands ---

program
  .command('hero [name]')
  .description('Get hero data')
  .action(async (name) => {
    if (name) {
      const hero = DATA.heroes.find(h => 
        h.id === name.toLowerCase() || 
        h.name.toLowerCase().includes(name.toLowerCase())
      );
      if (hero) console.log(format(hero));
      else console.error('Hero not found');
    } else {
      // Interactive
      const { heroId } = await inquirer.prompt([{
        type: 'list',
        name: 'heroId',
        message: 'Select a hero:',
        choices: DATA.heroes.map(h => ({ name: h.name, value: h.id })).sort((a, b) => a.name.localeCompare(b.name))
      }]);
      const hero = DATA.heroes.find(h => h.id === heroId);
      console.log(format(hero));
    }
  });

program
  .command('item [name]')
  .description('Get item data')
  .action(async (name) => {
    if (name) {
      const items = DATA.items.filter(i => 
        i.name.toLowerCase().includes(name.toLowerCase()) || 
        i.id === name.toLowerCase()
      );
      if (items.length === 1) console.log(format(items[0]));
      else if (items.length > 1) {
        console.log(`Found ${items.length} items. Please be more specific or use interactive mode.`);
        items.slice(0, 5).forEach(i => console.log(`- ${i.name} (${i.id})`));
      }
      else console.error('Item not found');
    } else {
      // Interactive - Filter by type first?
      const types = [...new Set(DATA.items.map(i => i.upgrade_type).filter(Boolean))];
      const { type } = await inquirer.prompt([{
        type: 'list',
        name: 'type',
        message: 'Select item type:',
        choices: ['All', ...types]
      }]);

      let choices = DATA.items;
      if (type !== 'All') {
        choices = choices.filter(i => i.upgrade_type === type);
      }

      const { itemId } = await inquirer.prompt([{
        type: 'list',
        name: 'itemId',
        message: 'Select an item:',
        choices: choices.map(i => ({ name: i.name, value: i.id })).sort((a, b) => a.name.localeCompare(b.name))
      }]);

      const item = DATA.items.find(i => i.id === itemId);
      console.log(format(item));
    }
  });

program
  .command('power [name]')
  .description('Get power data')
  .action(async (name) => {
    if (name) {
       const powers = DATA.powers.filter(p => 
        p.name.toLowerCase().includes(name.toLowerCase()) || 
        p.id === name.toLowerCase()
      );
       if (powers.length === 1) console.log(format(powers[0]));
       else if (powers.length > 1) {
         console.log(`Found ${powers.length} powers.`);
         powers.slice(0, 5).forEach(p => console.log(`- ${p.name} (${p.id})`));
       }
       else console.error('Power not found');
    } else {
      // Interactive
      const { powerId } = await inquirer.prompt([{
        name: 'powerId',
        message: 'Select a power:',
        type: 'list',
        choices: DATA.powers.map(p => ({ name: p.name, value: p.id })).sort((a, b) => a.name.localeCompare(b.name))
      }]);
      const power = DATA.powers.find(p => p.id === powerId);
      console.log(format(power));
    }
  });

program
  .command('player [name]')
  .description('Search for a player and get stats')
  .action(async (name) => {
    let searchName = name;
    if (!searchName) {
      const res = await inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: 'Enter player name (e.g. Turbotailz):'
      }]);
      searchName = res.name;
    }

    console.log(`Searching for "${searchName}"...`);
    try {
      const players = await searchPlayers(searchName);
      
      if (players.length === 0) {
        console.log('No players found.');
        return;
      }

      let selectedPlayer = players[0];
      
      if (players.length > 1) {
        const res = await inquirer.prompt([{
          type: 'list',
          name: 'playerUrl',
          message: 'Multiple players found. Select one:',
          choices: players.map(p => ({
            name: `${p.name} (${p.title}) - ${p.isPublic ? 'Public' : 'Private'}`,
            value: p
          }))
        }]);
        selectedPlayer = res.playerUrl;
      }

      if (!selectedPlayer.isPublic) {
        console.log('Selected profile is private. Cannot fetch stats.');
        return;
      }

      console.log(`Fetching stats for ${selectedPlayer.name}...`);
      // URL format from search is "id|hash", getPlayerStats expects just that
      const stats = await getPlayerStats(selectedPlayer.url);
      console.log(format(stats));

    } catch (e: any) {
      console.error('Error:', e.message);
    }
  });

program
  .command('interactive', { isDefault: true, hidden: true })
  .action(async () => {
    // Main Menu
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Lookup Hero', value: 'hero' },
        { name: 'Lookup Item', value: 'item' },
        { name: 'Lookup Power', value: 'power' },
        { name: 'Search Player Stats', value: 'player' },
        { name: 'Exit', value: 'exit' }
      ]
    }]);

    if (action === 'exit') return;

    // Delegate to existing commands
    // We can't easily call action handlers directly without refactoring, 
    // so we'll just run a sub-prompt logic here or spawn the command.
    // For simplicity, let's just re-implement the call logic
    
    if (action === 'hero') {
       const cmd = program.commands.find(c => c.name() === 'hero');
       if (cmd) {
         await cmd.parseAsync(['node', 'cli', 'hero'], { from: 'user' });
       }
    } else if (action === 'item') {
       const cmd = program.commands.find(c => c.name() === 'item');
       if (cmd) {
         await cmd.parseAsync(['node', 'cli', 'item'], { from: 'user' });
       }
    } else if (action === 'power') {
       const cmd = program.commands.find(c => c.name() === 'power');
       if (cmd) {
         await cmd.parseAsync(['node', 'cli', 'power'], { from: 'user' });
       }
    } else if (action === 'player') {
       const cmd = program.commands.find(c => c.name() === 'player');
       if (cmd) {
         await cmd.parseAsync(['node', 'cli', 'player'], { from: 'user' });
       }
    }
  });

program.parse(process.argv);

