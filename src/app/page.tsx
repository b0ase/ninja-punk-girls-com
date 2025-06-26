'use client';

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Right weapon filenames (shortened to just the key parts)
  const rightWeapons = [
    '07_001_Right-Weapon_Boxing-Glove_Yamarashii_Erobot_x_Uncommon_Strength_2_Speed_0_Skill_1_Stamina_1_Stealth_1_Style_1_.png',
    '07_002_Right-Weapon_Thrasher_Hikaru_Erobot_x_Common_Strength_0_Speed_2_Skill_1_Stamina_1_Stealth_2_Style_0_.png',
    '07_003_Right-Weapon_Red-Axe_Phi-Phi_Erobot_x_Uncommon_Strength_0_Speed_0_Skill_2_Stamina_0_Stealth_0_Style_1_.png',
    '07_004_Right-Weapon_Black-Axe_Scarlet_Erobot_x_Uncommon_Strength_1_Speed_0_Skill_1_Stamina_0_Stealth_2_Style_0_.png',
    '07_005_Right-Weapon_Ball-n-Chain_Payne_Erobot_x_Common_Strength_1_Speed_1_Skill_2_Stamina_1_Stealth_2_Style_2_.png',
    '07_006_Right-Weapon_Sword_Aika_NPG_x_Rare_Strength_1_Speed_2_Skill_1_Stamina_1_Stealth_0_Style_1_.png',
    '07_007_Right-Weapon_Short-Whip_Kimiko_NPG_x_Common_Strength_1_Speed_1_Skill_0_Stamina_2_Stealth_1_Style_2_.png',
    '07_008_Right-Weapon_Sai_Ayumi_NPG_x_Common_Strength_0_Speed_2_Skill_1_Stamina_2_Stealth_1_Style_2_.png',
    '07_009_Right-Weapon_Katana_Nao_NPG_x_Mythical_Strength_1_Speed_2_Skill_0_Stamina_0_Stealth_2_Style_2_.png',
    '07_010_Right-Weapon_Red-Bullwhip_x_Erobot_x_Mythical_Strength_1_Speed_1_Skill_1_Stamina_1_Stealth_2_Style_0_.png',
    '07_011_Right-Weapon_Graffiti-Can_x_x_x_Mythical_Strength_1_Speed_0_Skill_1_Stamina_2_Stealth_0_Style_1_.png',
    '07_012_Right-Weapon_Grenade-Launcher_x_x_x_Epic_Strength_0_Speed_0_Skill_2_Stamina_2_Stealth_1_Style_2_.png',
    '07_013_Right-Weapon_Laser-Rifle_x_x_x_Epic_Strength_0_Speed_1_Skill_0_Stamina_2_Stealth_2_Style_0_.png',
    '07_014_Right-Weapon_Flamethrower_x_x_x_Rare_Strength_0_Speed_1_Skill_0_Stamina_0_Stealth_2_Style_2_.png',
    '07_015_Right-Weapon_Sniper-Rifle_x_x_x_Epic_Strength_2_Speed_2_Skill_0_Stamina_1_Stealth_2_Style_0_.png',
    '07_016_Right-Weapon_Little-Thrasher_x_x_x_Epic_Strength_2_Speed_1_Skill_0_Stamina_0_Stealth_2_Style_0_.png',
    '07_017_Right-Weapon_Uzi_x_x_x_Common_Strength_0_Speed_0_Skill_1_Stamina_2_Stealth_2_Style_0_.png',
    '07_018_Right-Weapon_Chainsaw_x_x_x_Mythical_Strength_2_Speed_2_Skill_1_Stamina_0_Stealth_0_Style_2_.png',
    '07_019_Right-Weapon_Police-Handcuffs_x_x_x_Legendary_Strength_2_Speed_2_Skill_0_Stamina_2_Stealth_1_Style_0_.png',
    '07_020_Right-Weapon_Machete_x_x_x_Uncommon_Strength_2_Speed_1_Skill_1_Stamina_0_Stealth_2_Style_0_.png',
    '07_021_Right-Weapon_Bondage-Handcuffs_x_x_x_Epic_Strength_0_Speed_1_Skill_1_Stamina_0_Stealth_1_Style_0_.png',
    '07_022_Right-Weapon_Black-Cat_x_x_x_Mythical_Strength_2_Speed_1_Skill_1_Stamina_1_Stealth_1_Style_2_.png',
    '07_023_Right-Weapon_Whiskey-Bottle_x_x_x_Legendary_Strength_0_Speed_1_Skill_2_Stamina_1_Stealth_0_Style_2_.png',
    '07_024_Right-Weapon_Bullwhip_Peggy_Erobot_x_Mythical_Strength_1_Speed_2_Skill_1_Stamina_0_Stealth_2_Style_2_.png'
  ];

  // Left weapon filenames
  const leftWeapons = [
    '08_001_Left-Weapon_Paddle_Miyuki_Erobot_x_Mythical_Strength_2_Speed_0_Skill_0_Stamina_0_Stealth_0_Style_1_.png',
    '08_002_Left-Weapon_Boxing-Glove_Yamarashii_Erobot_x_Mythical_Strength_2_Speed_0_Skill_2_Stamina_0_Stealth_1_Style_0_.png',
    '08_003_Left-Weapon_Big-Knife_Joy_Erobot_x_Epic_Strength_1_Speed_0_Skill_1_Stamina_2_Stealth_2_Style_2_.png',
    '08_004_Left-Weapon_Black-Ax_Scarlet_Erobot_x_Common_Strength_0_Speed_0_Skill_1_Stamina_1_Stealth_2_Style_2_.png',
    '08_005_Left-Weapon_Sai_Ayumi_NPG_x_Mythical_Strength_1_Speed_1_Skill_1_Stamina_2_Stealth_0_Style_1_.png',
    '08_006_Left-Weapon_Small-Knife_Aika_NPG_x_Common_Strength_0_Speed_2_Skill_2_Stamina_1_Stealth_2_Style_2_.png',
    '08_007_Left-Weapon_Katana_Nao_NPG_x_Rare_Strength_1_Speed_0_Skill_1_Stamina_2_Stealth_1_Style_2_.png',
    '08_008_Left-Weapon_Red-Axe_Phi-Phi_Erobot_x_Common_Strength_0_Speed_0_Skill_1_Stamina_0_Stealth_0_Style_2_.png',
    '08_009_Left-Weapon_Short-Whip_x_NPG_x_Mythical_Strength_2_Speed_0_Skill_2_Stamina_2_Stealth_1_Style_2_.png',
    '08_010_Left-Weapon_Singletail_x_x_x_Common_Strength_2_Speed_2_Skill_2_Stamina_1_Stealth_2_Style_1_.png',
    '08_011_Left-Weapon_Red-Bullwhip_x_x_x_Rare_Strength_1_Speed_2_Skill_2_Stamina_1_Stealth_2_Style_0_.png',
    '08_012_Left-Weapon_Graffitti-Can_x_x_x_Legendary_Strength_0_Speed_1_Skill_2_Stamina_0_Stealth_0_Style_1_.png',
    '08_013_Left-Weapon_Grenade-Launcher_x_x_x_Epic_Strength_2_Speed_2_Skill_1_Stamina_1_Stealth_1_Style_0_.png',
    '08_014_Left-Weapon_Laser-Rifle_x_x_x_Legendary_Strength_2_Speed_0_Skill_2_Stamina_2_Stealth_1_Style_1_.png',
    '08_015_Left-Weapon_Flamethrower_x_x_x_Legendary_Strength_1_Speed_0_Skill_2_Stamina_0_Stealth_2_Style_1_.png',
    '08_016_Left-Weapon_Sniper-Rifle_x_x_x_Epic_Strength_2_Speed_1_Skill_0_Stamina_0_Stealth_2_Style_0_.png',
    '08_017_Left-Weapon_Little-Thrasher_x_x_x_Uncommon_Strength_0_Speed_1_Skill_2_Stamina_0_Stealth_0_Style_2_.png',
    '08_018_Left-Weapon_Uzi_x_x_x_Common_Strength_0_Speed_2_Skill_0_Stamina_1_Stealth_1_Style_0_.png',
    '08_019_Left-Weapon_Chainsaw_x_x_x_Legendary_Strength_0_Speed_2_Skill_1_Stamina_1_Stealth_2_Style_1_.png',
    '08_020_Left-Weapon_Police-Handcuffs_x_x_x_Epic_Strength_0_Speed_0_Skill_2_Stamina_1_Stealth_2_Style_1_.png',
    '08_021_Left-Weapon_Machete_x_x_x_Uncommon_Strength_1_Speed_2_Skill_2_Stamina_2_Stealth_0_Style_1_.png',
    '08_022_Left-Weapon_Bondage-Handcuffs_x_x_x_Rare_Strength_0_Speed_0_Skill_1_Stamina_2_Stealth_2_Style_0_.png',
    '08_023_Left-Weapon_Black-Cat_x_x_x_Common_Strength_1_Speed_2_Skill_0_Stamina_1_Stealth_1_Style_2_.png',
    '08_024_Left-Weapon_Bottle_x_x_x_Epic_Strength_1_Speed_1_Skill_0_Stamina_1_Stealth_2_Style_2_.png'
  ];

  // Combine all weapons
  const allWeapons = [...rightWeapons, ...leftWeapons];

  // Sample character cards
  const characterCards = [
    'card_0679_Kasui.jpg', 'card_0471_Sasha.jpg', 'card_0386_Ariho.jpg', 
    'card_3072_Nanashi.jpg', 'card_1273_Konoha.jpg', 'card_0663_Riyu.jpg',
    'card_0104_Seisa.jpg', 'card_0593_Tamaho.jpg', 'card_1363_Michie.jpg',
    'card_0794_Sama.jpg', 'card_0026_Miwako.jpg', 'card_0116_Shidzuku.jpg'
  ]

  // Create weapon background grid
  const createWeaponBackground = () => {
    return allWeapons.map((weaponFilename, index) => {
      const isRightWeapon = weaponFilename.startsWith('07_')
      const basePath = isRightWeapon ? '/assets/07-Right-Weapon' : '/assets/08-Left-Weapon'
      
      // Grid layout - 8 columns
      const cols = 8
      const row = Math.floor(index / cols)
      const col = index % cols
      
      const xOffset = col * 12.5 // 100/8 = 12.5% per column
      const yOffset = row * 15 + 5
      
      const rotation = (index * 37) % 360
      const size = 120 // Smaller size
      const opacity = 0.15 // Very transparent

      return (
        <div
          key={`weapon-${index}`}
          className="absolute"
          style={{
            left: `${xOffset}%`,
            top: `${yOffset}%`,
            transform: `rotate(${rotation}deg)`,
            width: `${size}px`,
            height: `${size}px`,
            zIndex: 1,
            opacity: opacity,
          }}
        >
          <Image
            src={`${basePath}/${weaponFilename}`}
            alt=""
            width={size}
            height={size}
            className="object-contain"
            loading="lazy"
            onError={(e) => {
              // Hide broken images
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )
    })
  }

  // Create character cards floating
  const createCharacterCards = () => {
    const positions = [
      { x: 10, y: 15 }, { x: 80, y: 20 }, { x: 20, y: 40 }, { x: 75, y: 50 },
      { x: 15, y: 65 }, { x: 85, y: 70 }, { x: 25, y: 25 }, { x: 70, y: 35 },
      { x: 40, y: 80 }, { x: 60, y: 15 }, { x: 5, y: 45 }, { x: 90, y: 60 }
    ]

    return characterCards.map((cardFilename, index) => {
      const pos = positions[index]
      const rotation = (index * 43) % 360
      const size = 140
      const opacity = 0.3

      return (
        <div
          key={`card-${index}`}
          className="absolute animate-pulse"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `rotate(${rotation}deg)`,
            width: `${size}px`,
            height: `${size}px`,
            zIndex: 2,
            opacity: opacity,
            animationDuration: `${3 + (index % 3)}s`,
          }}
        >
          <Image
            src={`/sample-cards/${cardFilename}`}
            alt=""
            width={size}
            height={size}
            className="object-contain rounded-lg"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl animate-pulse">Loading NINJA PUNK GIRLS...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Hazard tape borders */}
      <div 
        className="absolute top-0 left-0 right-0 h-8 z-10"
        style={{
          background: 'repeating-linear-gradient(45deg, #fbbf24 0px, #fbbf24 20px, #000000 20px, #000000 40px)'
        }}
      />
      <div 
        className="absolute bottom-0 left-0 right-0 h-8 z-10"
        style={{
          background: 'repeating-linear-gradient(-45deg, #fbbf24 0px, #fbbf24 20px, #000000 20px, #000000 40px)'
        }}
      />
      <div 
        className="absolute top-0 bottom-0 left-0 w-8 z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, #fbbf24 0px, #fbbf24 20px, #000000 20px, #000000 40px)'
        }}
      />
      <div 
        className="absolute top-0 bottom-0 right-0 w-8 z-10"
        style={{
          background: 'repeating-linear-gradient(180deg, #fbbf24 0px, #fbbf24 20px, #000000 20px, #000000 40px)'
        }}
      />

      {/* Weapon background grid */}
      <div className="absolute inset-0">
        {createWeaponBackground()}
      </div>

      {/* Character cards */}
      <div className="absolute inset-0">
        {createCharacterCards()}
      </div>

      {/* Main content */}
      <div className="relative z-20 h-screen flex items-center justify-center">
        <div className="max-w-6xl mx-auto px-8 flex items-center gap-16">
          {/* Character image on left */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-96 h-96 rounded-full overflow-hidden border-4 border-yellow-400 shadow-2xl shadow-yellow-400/20">
                <Image
                  src="/sample-cards/card_0679_Kasui.jpg"
                  alt="Ninja Punk Girl"
                  width={384}
                  height={384}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-yellow-400/10 animate-pulse" />
            </div>
          </div>

          {/* Content on right */}
          <div className="flex-1 text-center">
            <h1 className="text-6xl font-bold text-yellow-400 mb-6 drop-shadow-lg">
              NINJA PUNK GIRLS
            </h1>
            <p className="text-xl text-white mb-8 leading-relaxed">
              Enter a cyberpunk world where ancient ninja traditions meet futuristic rebellion. 
              Collect, battle, and customize your ultimate warrior squad.
            </p>
            
            <div className="flex gap-6 justify-center">
              <button className="bg-yellow-400 text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
                ENTER GAME
              </button>
              <button className="border-2 border-yellow-400 text-yellow-400 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 hover:text-black transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
                LEARN MORE
              </button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">{allWeapons.length}</div>
                <div className="text-white">Weapons</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">1000+</div>
                <div className="text-white">Characters</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">∞</div>
                <div className="text-white">Possibilities</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute bottom-4 right-4 z-20 bg-black/70 text-yellow-400 px-4 py-2 rounded-lg text-sm border border-yellow-400/30">
        {allWeapons.length} weapons loaded • {characterCards.length} characters
      </div>
    </div>
  )
}

