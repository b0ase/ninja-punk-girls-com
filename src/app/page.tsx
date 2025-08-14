'use client';

import { useState, useEffect } from 'react'
import Image from 'next/image'
// import { useHandCash } from '@/context/HandCashContext' // TODO: Restore HandCash when ready
// import HandCashConnectButton from '@/components/HandCashConnectButton' // TODO: Restore HandCash when ready

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [currentTime, setCurrentTime] = useState(0)
// const { isConnected, connect, profile } = useHandCash() // TODO: Restore HandCash when ready

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Track mouse position for parallax effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    // Animation loop for time-based effects
    const animate = () => {
      setCurrentTime(prev => prev + 0.016) // ~60fps
      requestAnimationFrame(animate)
    }
    const animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
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

  // Avatar images for cycling
  const avatarImages = [
    'card_0104_Seisa.jpg',
    'card_0679_Kasui.jpg',
    'card_0471_Sasha.jpg',
    'card_0386_Ariho.jpg',
    'card_3072_Nanashi.jpg',
    'card_1273_Konoha.jpg',
    'card_0663_Riyu.jpg',
    'card_0593_Tamaho.jpg',
    'card_1363_Michie.jpg',
    'card_0794_Sama.jpg',
    'card_0026_Miwako.jpg',
    'card_0116_Shidzuku.jpg'
  ]

  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0)

  // Cycle through avatar images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAvatarIndex((prevIndex) => (prevIndex + 1) % avatarImages.length)
    }, 3000) // Change image every 3 seconds

    return () => clearInterval(interval)
  }, [avatarImages.length])

  // Create floating weapon background with enhanced animations
  const createWeaponBackground = () => {
    return allWeapons.map((weaponFilename, index) => {
      const isRightWeapon = weaponFilename.startsWith('07_')
      const basePath = isRightWeapon ? '/assets/07-Right-Weapon' : '/assets/08-Left-Weapon'
      
      // Dynamic positioning with time-based movement
      const baseX = (index * 137.5) % 100 // Golden angle for better distribution
      const baseY = (index * 233.3) % 100
      
      // Floating animation
      const floatOffset = Math.sin(currentTime * 0.5 + index * 0.1) * 20
      const xOffset = baseX + Math.sin(currentTime * 0.3 + index * 0.05) * 5
      const yOffset = baseY + floatOffset
      
      // Rotation with different speeds
      const rotation = (currentTime * 10 + index * 37) % 360
      const size = 80 + Math.sin(currentTime * 0.2 + index * 0.1) * 20 // Breathing effect
      const opacity = 0.1 + Math.sin(currentTime * 0.4 + index * 0.2) * 0.05

      // Parallax effect based on mouse position
      const parallaxX = (mousePosition.x - window.innerWidth / 2) * 0.01
      const parallaxY = (mousePosition.y - window.innerHeight / 2) * 0.01

      return (
        <div
          key={`weapon-${index}`}
          className="absolute transition-transform duration-300 ease-out"
          style={{
            left: `${xOffset}%`,
            top: `${yOffset}%`,
            transform: `rotate(${rotation}deg) translate(${parallaxX}px, ${parallaxY}px)`,
            width: `${size}px`,
            height: `${size}px`,
            zIndex: 1,
            opacity: opacity,
            filter: `hue-rotate(${index * 15}deg)`,
          }}
        >
          <Image
            src={`${basePath}/${weaponFilename}`}
            alt=""
            width={size}
            height={size}
            className="object-contain drop-shadow-lg"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )
    })
  }

  // Create enhanced character cards with floating animations
  const createCharacterCards = () => {
    const positions = [
      { x: 10, y: 15 }, { x: 80, y: 20 }, { x: 20, y: 40 }, { x: 75, y: 50 },
      { x: 15, y: 65 }, { x: 85, y: 70 }, { x: 25, y: 25 }, { x: 70, y: 35 },
      { x: 40, y: 80 }, { x: 60, y: 15 }, { x: 5, y: 45 }, { x: 90, y: 60 }
    ]

    return characterCards.map((cardFilename, index) => {
      const pos = positions[index]
      
      // Enhanced floating animation
      const floatY = Math.sin(currentTime * 0.3 + index * 0.5) * 15
      const floatX = Math.cos(currentTime * 0.2 + index * 0.3) * 10
      const rotation = (currentTime * 5 + index * 43) % 360
      const size = 120 + Math.sin(currentTime * 0.4 + index * 0.2) * 15
      const opacity = 1.0 // Fully opaque

      // Parallax effect
      const parallaxX = (mousePosition.x - window.innerWidth / 2) * 0.02
      const parallaxY = (mousePosition.y - window.innerHeight / 2) * 0.02

      return (
        <div
          key={`card-${index}`}
          className="absolute transition-all duration-500 ease-out hover:scale-110 hover:z-30"
          style={{
            left: `${pos.x + floatX}%`,
            top: `${pos.y + floatY}%`,
            transform: `rotate(${rotation}deg) translate(${parallaxX}px, ${parallaxY}px)`,
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
            className="object-contain rounded-lg shadow-2xl hover:shadow-pink-400/50 transition-shadow duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )
    })
  }

  // Create particle effect background
  const createParticles = () => {
    const particles = []
    for (let i = 0; i < 50; i++) {
      const x = (i * 137.5) % 100
      const y = (i * 233.3) % 100
      const size = 2 + Math.sin(currentTime * 0.5 + i * 0.1) * 1
      const opacity = 0.3 + Math.sin(currentTime * 0.3 + i * 0.2) * 0.2
      
      particles.push(
        <div
          key={`particle-${i}`}
          className="absolute bg-pink-400 rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${size}px`,
            height: `${size}px`,
            opacity: opacity,
            zIndex: 0,
            animation: `twinkle ${2 + (i % 3)}s infinite`,
          }}
        />
      )
    }
    return particles
  }

  // Create glitch effect for title
  const GlitchText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`relative ${className}`}>
      <div className="relative z-10">{children}</div>
      <div 
        className="absolute inset-0 z-20 text-pink-500 opacity-80"
        style={{
          animation: 'glitch 0.3s infinite',
          clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
          transform: 'translate(-2px, 0)',
        }}
      >
        {children}
      </div>
      <div 
        className="absolute inset-0 z-20 text-purple-500 opacity-80"
        style={{
          animation: 'glitch 0.3s infinite reverse',
          clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
          transform: 'translate(2px, 0)',
        }}
      >
        {children}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Loading animation background */}
        <div className="absolute inset-0">
          {createParticles()}
        </div>
        
        <div className="relative z-10 text-center">
          <div className="text-pink-400 text-4xl font-bold mb-4 animate-pulse">
            NINJA PUNK GIRLS
          </div>
          <div className="text-pink-400 text-xl animate-bounce">
            Loading...
          </div>
          <div className="mt-8 w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-pink-400 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, (currentTime * 50))}%`,
                animation: 'loading-bar 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Static hazard tape borders */}
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

      {/* Particle background */}
      <div className="absolute inset-0">
        {createParticles()}
      </div>

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
          {/* Character image on left with enhanced animations */}
          <div className="flex-shrink-0">
            <div className="relative group">
              <div 
                className="w-96 h-96 rounded-full overflow-hidden border-4 border-pink-400 shadow-2xl shadow-pink-400/20 relative"
                style={{
                  animation: 'float 3s ease-in-out infinite',
                  transform: `translate(${(mousePosition.x - window.innerWidth / 2) * 0.02}px, ${(mousePosition.y - window.innerHeight / 2) * 0.02}px)`,
                }}
              >
                <Image
                  src={`/sample-cards/${avatarImages[currentAvatarIndex]}`}
                  alt="Ninja Punk Girl"
                  width={384}
                  height={384}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 transition-opacity duration-1000"
                  priority
                />
                {/* Enhanced glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/20 via-magenta-500/10 to-purple-500/20 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-pink-400/5 animate-ping" />
              </div>
              
              {/* Orbiting elements */}
              <div 
                className="absolute inset-0 rounded-full border-2 border-pink-400/30"
                style={{
                  animation: 'rotate 10s linear infinite',
                }}
              />
              <div 
                className="absolute inset-0 rounded-full border-2 border-magenta-500/30"
                style={{
                  animation: 'rotate 15s linear infinite reverse',
                }}
              />
            </div>
          </div>

          {/* Content on right with enhanced animations */}
          <div className="flex-1 text-center">
            <GlitchText className="text-6xl font-bold text-pink-400 mb-6 drop-shadow-lg">
              NINJA PUNK GIRLS
            </GlitchText>
            
            <p className="text-xl text-white mb-8 leading-relaxed animate-fade-in-up">
              Enter a cyberpunk world where ancient ninja traditions meet futuristic rebellion. 
              Collect, battle, and customize your ultimate warrior squad.
            </p>
            
            <div className="flex gap-6 justify-center">
              {/* HandCash connect logic temporarily disabled - TODO: Restore when HandCashContext is back */}
              {/* {isConnected ? (
                <div className="flex flex-col items-center gap-4">
                  <button 
                    className="bg-pink-400 text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-pink-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:rotate-1 relative overflow-hidden group"
                    style={{
                      animation: 'pulse-glow 2s ease-in-out infinite',
                    }}
                    onClick={() => window.location.href = '/mint'}
                  >
                    <span className="relative z-10">ENTER GAME</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                  {profile && (
                    <p className="text-sm text-pink-400 font-mono">
                      Connected as ${profile.publicProfile.handle}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-gray-400">Connect your HandCash wallet in the navbar to enter the game</p>
                </div>
              )} */}
              
              <button 
                className="border-2 border-pink-400 text-pink-400 px-8 py-4 rounded-lg font-bold text-lg hover:bg-pink-400 hover:text-black transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-rotate-1 relative overflow-hidden group"
                onClick={() => window.location.href = '/story'}
              >
                <span className="relative z-10">LEARN MORE</span>
                <div className="absolute inset-0 bg-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8 text-center">
              <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-3xl font-bold text-pink-400 mb-2 animate-bounce">{allWeapons.length}</div>
                <div className="text-white">Weapons</div>
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-3xl font-bold text-pink-400 mb-2 animate-bounce">1000+</div>
                <div className="text-white">Characters</div>
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <div className="text-3xl font-bold text-pink-400 mb-2 animate-bounce">∞</div>
                <div className="text-white">Possibilities</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced status indicator */}
      <div 
        className="absolute bottom-4 right-4 z-20 bg-black/70 text-pink-400 px-4 py-2 rounded-lg text-sm border border-pink-400/30 backdrop-blur-sm"
        style={{
          animation: 'slide-in-right 1s ease-out',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
          {allWeapons.length} weapons loaded • {characterCards.length} characters
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(236, 72, 153, 0.5); }
          50% { box-shadow: 0 0 40px rgba(236, 72, 153, 0.8); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

