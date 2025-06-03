import React from 'react'
import { BiGlobe, BiTv, BiBookOpen } from 'react-icons/bi'
import Link from 'next/link'

export const OurPlatforms: React.FC = () => {
  const platforms = [
    {
      name: 'Dawan TV',
      description:
        'Broadcasting in Somali, focusing on the Somali region within the Horn of Africa.',
      url: 'https://dawan.so',
      displayUrl: 'Dawan.so',
      icon: <BiTv className="h-8 w-8 sm:h-12 sm:w-12" />,
      language: 'Somali',
      bgColor: 'bg-[#2aaac6]',
      hoverColor: 'hover:bg-[#1e88a8]',
    },
    {
      name: 'Dawan Africa',
      description:
        'Delivering news and content in English, covering the Horn of Africa countries and beyond.',
      url: 'https://dawan.africa',
      displayUrl: 'Dawan.africa',
      icon: <BiGlobe className="h-8 w-8 sm:h-12 sm:w-12" />,
      language: 'English',
      bgColor: 'bg-[#2aaac6]',
      hoverColor: 'hover:bg-[#1e88a8]',
    },
    {
      name: 'بوابة إفريقيا (Africa Gateway)',
      description:
        'An Arabic-language platform connecting the Horn of Africa with the broader Arab world.',
      url: 'https://bawabah.africa',
      displayUrl: 'Bawabah.africa',
      icon: <BiBookOpen className="h-8 w-8 sm:h-12 sm:w-12" />,
      language: 'Arabic',
      bgColor: 'bg-[#2aaac6]',
      hoverColor: 'hover:bg-[#1e88a8]',
    },
  ]

  return (
    <section className="bg-white py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Our Platforms
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Three major platforms serving diverse audiences across languages and regions.
            </p>
          </div>

          {/* Platforms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {platforms.map((platform, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg sm:rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300 group flex flex-col h-full"
              >
                {/* Icon and Language Badge */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div
                    className={`${platform.bgColor} ${platform.hoverColor} text-white p-3 sm:p-4 rounded-lg sm:rounded-xl transition-colors duration-300`}
                  >
                    {platform.icon}
                  </div>
                  <span className="text-xs sm:text-sm bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 rounded-full font-medium">
                    {platform.language}
                  </span>
                </div>

                {/* Platform Name */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 group-hover:text-[#2aaac6] transition-colors duration-300">
                  {platform.name}
                </h3>

                {/* Description */}
                <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed flex-grow">
                  {platform.description}
                </p>

                {/* Visit Link */}
                <div className="mt-auto">
                  <Link
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center w-full ${platform.bgColor} ${platform.hoverColor} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-colors duration-300`}
                  >
                    Visit {platform.displayUrl}
                    <BiGlobe className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Message */}
          <div className="text-center mt-12 sm:mt-16">
            <div className="bg-[#2aaac6] rounded-lg sm:rounded-xl p-6 sm:p-8 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                Connecting Communities Across Languages
              </h3>
              <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Bridging cultures and fostering understanding throughout the Horn of Africa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
