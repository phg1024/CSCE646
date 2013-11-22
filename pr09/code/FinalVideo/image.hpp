#ifndef IMAGE_HPP
#define IMAGE_HPP

#include "color.h"
using namespace Color;

template <typename T>
class Image
{
public:
    typedef T pixel_t;

    Image():w(0),h(0),pixmap(NULL){}
    Image(int w, int h):w(w),h(h),pixmap(new T[w*h]){}
    Image(const Image& other):w(other.w), h(other.h) {
        memcpy(pixmap, other.pixmap, sizeof(T)*w*h);
    }

    ~Image(){ if( pixmap != NULL ) delete[] pixmap; }

    Image& operator=(const Image& other) {
        w = other.w;
        h = other.h;
        memcpy(pixmap, other.pixmap, sizeof(T)*w*h);
    }

    template <typename FT>
    Image map(FT f) {
        Image I(w, h);
        for(int y=0,idx=0;y<h;y++) {
            for(int x=0;x<w;x++,idx++) {
                I.setPixel(x, y, f(pixmap[idx]));
            }
        }
        return I;
    }

    void resize(int width, int height)
    {
        w = width;
        h = height;
        if( pixmap != NULL ) delete[] pixmap;
        pixmap = new pixel_t[w * h];
    }

    int width() const{ return w;}
    int height() const { return h; }

    void setPixel(int x, int y, const pixel_t& p)
    {
        pixmap[y*w + x] = p;
    }

    pixel_t getPixel(int x, int y) const
    {
        return pixmap[y*w+x];
    }

    pixel_t sample(float x, float y) {
        int ty = Math.floor(y);
        int dy = Math.ceil(y);

        int lx = Math.floor(x);
        int rx = Math.ceil(x);

        float fx = x - lx;
        float fy = y - ty;

        pixel_t c = this.getPixel(lx, ty) * ((1-fy) * (1-fx))
                + (this.getPixel(lx, dy) * (fy * (1-fx)))
                + (this.getPixel(rx, ty) * ((1-fy) * fx))
                + (this.getPixel(rx, dy) * (fy * fx));

        c.clamp();

        return c;
    }

    void fill(int x0, int y0, int width, int height, const T& c)
    {
        int y1 = y0 + height;
        int x1 = x0 + width;
        for(int y=y0;y<y1;y++)
            for(int x=x0;x<x1;x++)
                pixmap[y*w+x] = c;
    }

    void fill(const T& c)
    {
        fill(0, 0, w, h, c);
    }

    T* raw_data() const { return pixmap; }

private:
    int w, h;
    T* pixmap;
};

typedef Image<RGB> RGBImage;

#endif // IMAGE_HPP
