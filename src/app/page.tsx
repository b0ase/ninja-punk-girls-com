'use client';

import Image from 'next/image'
import { useHandCashWallet } from '@/context/HandCashWalletContext'
import { WalletCreator } from '@/components/WalletCreator'
import { WalletStatus } from '@/components/WalletStatus'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const { isConnected, wallet, isLoading, error } = useHandCashWallet()
  
  // All sample cards from the directory
  const sampleCards = [
    'card_0026_Miwako.jpg', 'card_0104_Seisa.jpg', 'card_0116_Shidzuku.jpg',
    'card_0122_Monaka.jpg', 'card_0129_Kohaku.jpg', 'card_0189_Yukiho.jpg',
    'card_0347_Tsuguri.jpg', 'card_0351_Yorimi.jpg', 'card_0386_Ariho.jpg',
    'card_0412_Momi.jpg', 'card_0417_Kiho.jpg', 'card_0421_Kohana.jpg',
    'card_0454_Junrei.jpg', 'card_0471_Sasha.jpg', 'card_0474_Yumemi.jpg',
    'card_0563_Ayae.jpg', 'card_0593_Tamaho.jpg', 'card_0607_Tomoko.jpg',
    'card_0651_Atsuna.jpg', 'card_0656_Sarana.jpg', 'card_0663_Riyu.jpg',
    'card_0664_Haruna.jpg', 'card_0728_Kitsuki.jpg', 'card_0739_Ina.jpg',
    'card_0754_Aoki.jpg', 'card_0784_Maou.jpg', 'card_0794_Sama.jpg',
    'card_0808_Wayu.jpg', 'card_0810_Chinatsu.jpg', 'card_0822_Yoshiko.jpg',
    'card_0834_Yuzumi.jpg', 'card_0881_Mie.jpg', 'card_0919_Yui.jpg',
    'card_0933_Shiou.jpg', 'card_1010_Kihiro.jpg', 'card_1064_Mineko.jpg',
    'card_1082_Mutsuka.jpg', 'card_1205_Asahi.jpg', 'card_1257_Mizuse.jpg',
    'card_1273_Konoha.jpg', 'card_1300_Otowa.jpg', 'card_1304_Youna.jpg',
    'card_1308_Miho.jpg', 'card_1357_Reino.jpg', 'card_1363_Michie.jpg',
    'card_1433_Nawa.jpg', 'card_1466_Miwa.jpg', 'card_1470_Hiroo.jpg',
    'card_1499_Mizue.jpg', 'card_1568_Itsumi.jpg', 'card_1613_Mahiro.jpg',
    'card_1615_Mahiru.jpg', 'card_1650_Monan.jpg', 'card_1693_Suzumi.jpg',
    'card_1794_Kiyomi.jpg', 'card_1864_Seya.jpg', 'card_1890_Manami.jpg',
    'card_1918_Mizuna.jpg', 'card_1925_Shuki.jpg', 'card_1933_Okiku.jpg',
    'card_1936_Ayu.jpg', 'card_1978_Hitona.jpg', 'card_1984_Mikoto.jpg',
    'card_1994_Satoko.jpg', 'card_2029_Yuchika.jpg', 'card_2157_Shioe.jpg',
    'card_2190_Marise.jpg', 'card_2195_Iri.jpg', 'card_2238_Seiko.jpg',
    'card_2262_Nire.jpg', 'card_2283_Toa.jpg', 'card_2301_Shouka.jpg',
    'card_2343_Makiho.jpg', 'card_2363_Monaka.jpg', 'card_2510_Tsubame.jpg',
    'card_2613_Hisami.jpg', 'card_2752_Ai.jpg', 'card_2792_Kane.jpg',
    'card_2823_Kotoki.jpg', 'card_2845_Harukichi.jpg', 'card_2848_Hadzuki.jpg',
    'card_2922_Eri.jpg', 'card_2951_Kazumi.jpg', 'card_2988_Sayori.jpg',
    'card_3008_Aiki.jpg', 'card_3038_Miaya.jpg', 'card_3041_Naemi.jpg',
    'card_3059_Konana.jpg', 'card_3070_Kai.jpg', 'card_3072_Nanashi.jpg',
    'card_3120_Kasui.jpg', 'card_3149_Kanori.jpg', 'card_3155_Akie.jpg',
    'card_3168_Tamawo.jpg', 'card_3185_Chidzuki.jpg', 'card_3205_Kie.jpg',
    'card_3232_Kameko.jpg', 'card_3246_Tokie.jpg', 'card_3259_Haruyo.jpg'
  ]

  return (
    <div className="min-h-screen bg-black p-4 relative">
      {/* Glowing gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-purple-900/30 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-600/10 via-transparent to-purple-600/10"></div>
      
      {/* Simple wallpaper grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 relative z-10">
        {sampleCards.map((cardFilename, index) => (
          <div
            key={cardFilename}
          >
            <Image
              src={`/sample-cards/${cardFilename}`}
              alt=""
              width={180}
              height={220}
              className="object-contain w-full h-auto"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      
      {/* Big title overlaid on top */}
      <div className="fixed top-0 left-0 right-0 h-screen flex items-center justify-center pointer-events-none z-50">
        <div className="relative">
          {/* Background blur/shadow */}
          <div className="absolute inset-0 bg-black/60 blur-xl rounded-3xl transform scale-110"></div>
          <div className="text-center">
            <h1 className="font-cyberpunk-italic text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[12rem] text-white relative z-10 drop-shadow-2xl px-8 py-2" 
                style={{
                  textShadow: '0 0 20px rgba(236, 72, 153, 0.8), 0 0 40px rgba(168, 85, 247, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)',
                  WebkitTextStroke: '2px #ec4899'
                }}>
              NINJA PUNK GIRLS
            </h1>
            <h2 className="font-mono text-sm sm:text-base md:text-lg lg:text-xl text-pink-300 relative z-10 drop-shadow-xl px-8 py-1 font-bold tracking-wider" 
                style={{
                  textShadow: '0 0 10px rgba(236, 72, 153, 0.8), 0 0 20px rgba(168, 85, 247, 0.5)'
                }}>
              VS THE EVIL EROBOTS
            </h2>
            
            {/* HandCash White-label Wallet Logic */}
            <div className="mt-8 pointer-events-auto">
              {isConnected ? (
                <WalletStatus onDisconnect={() => {}} />
              ) : (
                <WalletCreator onWalletCreated={() => {}} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
