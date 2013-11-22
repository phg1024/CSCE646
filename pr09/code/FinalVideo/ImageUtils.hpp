#ifndef IMAGEUTILS_HPP
#define IMAGEUTILS_HPP

#include "image.hpp"

namespace ImageUtils {

// resize the image
template <typename T>
T imresize(const T& img, int w, int h) {
	cout << "resizing image to " << w << "x" << h << endl;
	T I(w, h);
	int iw = img.width();
	int ih = img.height();
	
    // bilinear interpolation
    float ystep = 1.0 / (h-1);
    float xstep = 1.0 / (w-1);
    for(int i=0;i<h;i++)
    {
        float y = i * ystep;

        for(int j=0;j<w;j++)
        {
            float x = j * xstep;

            I.setPixel(j, i, img.sample(x * (iw-1), y * (ih-1)));
        }
    }
	cout << "done." << endl;
    return I;
}

// flip the image
template <typename T>
T flip(const T& img) {
	int w = img.width(), h = img.height();
	T I(w, h);
	
	for(int i=0;i<h;i++) {
		for(int j=0;j<w;j++) {
			I.setPixel(j, i, img.getPixel(j, h-1-i));
		}
	}
	return I;
}

}

#endif // IMAGEUTILS_HPP
