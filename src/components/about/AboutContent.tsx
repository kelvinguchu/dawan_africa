import React from 'react'
import { BiBookOpen, BiAnalyse, BiTrendingUp, BiGroup } from 'react-icons/bi'

export const AboutContent: React.FC = () => {
  const services = [
    {
      icon: <BiBookOpen className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: 'Comprehensive News',
      description: 'Breaking news and current affairs from across the Horn of Africa region.',
    },
    {
      icon: <BiAnalyse className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: 'In-Depth Analysis',
      description:
        'Expert analysis and commentary on political, economic, and social developments.',
    },
    {
      icon: <BiTrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: 'Business Insights',
      description: 'Market trends, economic indicators, and business opportunities in the region.',
    },
    {
      icon: <BiGroup className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: 'Cultural Stories',
      description: 'Rich cultural heritage, traditions, and stories that shape our communities.',
    },
  ]

  return (
    <section className="bg-gray-50 py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Our Mission
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Dawan Media Group is a dynamic media company established in 2023, dedicated to
              covering the Horn of Africa region. We provide comprehensive news, in-depth analysis,
              business insights, political coverage, and cultural stories that matter.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 text-center group"
              >
                <div className="text-[#2aaac6] mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  {service.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          {/* Vision Statement */}
          <div className="bg-white rounded-lg sm:rounded-xl p-8 sm:p-12 shadow-sm text-center">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
              Our Vision
            </h3>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              At Dawan Media Group, we are committed to informing, engaging, and connecting
              communities across languages and borders. We believe in the power of authentic
              storytelling to bridge cultures and foster understanding throughout the Horn of Africa
              and beyond.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
