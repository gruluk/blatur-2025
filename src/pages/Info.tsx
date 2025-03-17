import Header from '@/components/Header'
import Image from 'next/image'

export default function Info() {
  return (
    <div className="min-h-screen bg-onlineBlue text-white p-6">
      <Header />

      <div className="mt-20 pt-5 mb-6 margin-auto">
        <div className="max-w-xl mx-auto p-6 rounded-lg flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-onlineOrange">
            Informasjon
          </h1>
          <div>Vi bor her</div>
          <Image src={'/images/boo.png'} alt="bo" width={500} height={300} />

          <h2 className="text-2xl md:text-3xl font-bold text-onlineOrange">
            Bo
          </h2>
          <div>Vi bor på to steder, de er rett ved siden av hverandre</div>
          <div className="flex flex-row gap-4">
            <div>
              <a
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                target="_blank"
                href="https://www.google.com/maps/place/Perlov%C3%A1+366%2F6,+110+00+Star%C3%A9+M%C4%9Bsto,+Tsjekkia/@50.0873171,14.4128339,15.13z/data=!4m6!3m5!1s0x470b94edd5322bbf:0x24367958b601633c!8m2!3d50.0835338!4d14.4211109!16s%2Fg%2F11spnq63bs?entry=tts&g_ep=EgoyMDI1MDMxMC4wIPu8ASoASAFQAw%3D%3D"
              >
                BO 1 - 14 personer (link)
              </a>
              <div className="flex flex-col">
                <b>Erlend</b>
                <div>Luka</div>
              </div>
            </div>
            <div>
              <a
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                target="_blank"
                href="https://www.google.com/maps/place/Michalsk%C3%A1+439%2F13,+110+00+Star%C3%A9+M%C4%9Bsto,+Tsjekkia/@50.0851411,14.4148119,601m/data=!3m2!1e3!4b1!4m10!1m2!2m1!1zTWljaGFsc2vDoSA0MzkvMTMsIEhsYXZuw60gbcSbc3RvIFByYWhhLCBIbGF2bsOtIG3Em3N0byBQcmFoYSAxMTAgMDAsIFRzamVra2lh!3m6!1s0x470b94eec1b7e5cb:0x420ff7d20ea6168!8m2!3d50.0851378!4d14.4196828!15sCk5NaWNoYWxza8OhIDQzOS8xMywgSGxhdm7DrSBtxJtzdG8gUHJhaGEsIEhsYXZuw60gbcSbc3RvIFByYWhhIDExMCAwMCwgVHNqZWtraWGSARBnZW9jb2RlZF9hZGRyZXNz4AEA!16s%2Fg%2F11c5bwrjr6?entry=ttu&g_ep=EgoyMDI1MDMxMS4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D"
              >
                BO 2 - 12 personer (link)
              </a>
              <div className="flex flex-col">
                <div>
                  <b>Mattis</b>
                </div>
                <div>Luka</div>
              </div>
            </div>
          </div>
          <div>{/*Mattis cooker her*/}</div>

          <h2 className="text-2xl md:text-3xl font-bold text-onlineOrange pt-6">
            Flytur hjem
          </h2>
          <div>
            Det tar 30min med bolt og 45min med kollektiv, flyet går 11:35
          </div>
          <Image
            src="/images/blaaturhjem.png"
            alt="blaaturhjem"
            width={500}
            height={300}
          />
        </div>
        <div className="max-w-4xl mx-auto"></div>
      </div>
    </div>
  )
}
