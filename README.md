# DF Tools
Tools for modders and players.

## Direct links
- [DF Tools](https://jose96xd.github.io/DF_Tools/):
    - [Weapon Calculator](https://jose96xd.github.io/DF_Tools/Modules/WeaponCalculator.html): To calculate weapon related stats like momentum, penetration and similar against armor.
    - Layer Permit Checker (on development): To calculate the clothes and armor a creature can wear and help with modded clothes and layouts.


I will be adding more as I finish the ones in development. Also, as I learn more js and CSS I will try to make them prettier and more efficient.
For now, all the js is native with no external code, so I think it should (at least) be smallish.

## General use
Each module is more or less independent. I will try to make sure that all the functionalities that one would like are inside each module to avoid needing to switch between them in excess.

## Note
I'm making this website as fast as I can so don't expect too much beauty. I will try to come back to clean everything once I have more time. Also, I'm learning HTML, CSS and js at the same time as I do this, so for now, functionality will be prioritized over everything else.
A major refactor of everything will be done sooner than later.


## Index
- [DF Tools](#df-tools)
  - [Direct links](#direct-links)
  - [General use](#general-use)
  - [Note](#note)
  - [Index](#index)
  - [Modules](#modules)
    - [Weapon Calculator](#weapon-calculator)
    - [Layer Permit Checker](#layer-permit-checker)

## Modules

### Weapon Calculator
[Weapon Calculator](https://jose96xd.github.io/DF_Tools/Modules/WeaponCalculator.html)
To calculate weapon related stats like momentum, penetration and similar against armor.

#### Current features
- Momentum calculation for various races.
- Penetration conditions calculation against armor layers.
- Support for custom weapons, attacks, races, armors and materials.
- Support for enemy states (prone, normal) and attacks types (heavy, quick and normal attacks).

#### TODO list
- Add more races and materials (including procedural).
- Automate material weakness load for vanilla races.
- Investigate traps behavior more.
- Add defender stats to the math (currently no depth or reduction of the contact area is applied so this assumes a big target).
- Consider accumulative volume of armor when measuring penetration.
- Ranged attacks.
- Throwing objects.
- "Natural" attacks (made with body parts).
- Model the type of armor better (clothes are even worse than flexible armor with the same material).
- Support for material weaknesses.

### Layer Permit Checker
Layer Permit Checker
A tool to check how different armor pieces interact with each other. It helps to plan layouts and to calculate total volume of the armor layouts. 

#### TODO list
- Add more body distributions (currently only humanoid distributions are considered for armor accumulative volume).
