import React from "react"
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
// import "../../.."
// Import required modules
import { FreeMode, Pagination,Autoplay,Navigation } from 'swiper/modules';

import CourseCard from "./CourseCard"

function CourseSlider({ Courses }) {
  return (
    <>
      {Courses?.length ? (
        <Swiper
          slidesPerView={3}
          spaceBetween={25}
          loop={true}
          freemode={true}
          //pagination={true}
          //navigation={true}
          modules={[Autoplay,Navigation,FreeMode, Pagination]}
          className="mySwiper max-h-[30rem]"
          breakpoints={{
            1024: {
              slidesPerView: 3,
            },
          }}
          autoplay={{
            delay:1500,
            disableOnInteraction:false,
          }}
        >
          {Courses?.map((course, i) => (
            <SwiperSlide key={i}>
              <CourseCard course={course} Height={"h-[250px]"} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <p className="text-xl text-richblack-5">No Course Found</p>
      )}
    </>
  )
}

export default CourseSlider
