#ifndef COLOR_H
#define COLOR_H

#include "utils.hpp"

namespace Color
{

class RGBPixel
{
public:
    typedef unsigned char channel_t;
    static const RGBPixel white;
    static const RGBPixel black;
    static const RGBPixel red;
    static const RGBPixel green;
    static const RGBPixel blue;
    static const RGBPixel yellow;

    RGBPixel(){}
    RGBPixel(unsigned char r,
        unsigned char g,
        unsigned char b):r(r), g(g), b(b){}

    RGBPixel operator+(const RGBPixel& rhs)
    {
        RGBPixel c = (*this);
        c.r += rhs.r;
        c.g += rhs.g;
        c.b += rhs.b;
        return c;
    }

    RGBPixel& operator+=(const RGBPixel& rhs)
    {
        r += rhs.r;
        g += rhs.g;
        b += rhs.b;
        return (*this);
    }

    RGBPixel operator*(float f) const
    {
        RGBPixel c = (*this);
        c.r *= f;
        c.g *= f;
        c.b *= f;
        return c;
    }

    void clamp() {
        r = Utils::clamp<channel_t>(r, 0, 255);
        g = Utils::clamp<channel_t>(g, 0, 255);
        b = Utils::clamp<channel_t>(b, 0, 255);
    }

    channel_t r, g, b;
};

const RGBPixel RGBPixel::white = RGBPixel(255, 255, 255);
const RGBPixel RGBPixel::black = RGBPixel(0, 0, 0);
const RGBPixel RGBPixel::red = RGBPixel(255, 0, 0);
const RGBPixel RGBPixel::green = RGBPixel(0, 255, 0);
const RGBPixel RGBPixel::blue = RGBPixel(0, 0, 255);
const RGBPixel RGBPixel::yellow = RGBPixel(255, 255, 0);

static RGBPixel interpolate(const RGBPixel& c1, const RGBPixel& c2, float t)
{
    RGBPixel c;
    c.r = Utils::interpolate<RGBPixel::channel_t>(c1.r, c2.r, t);
    c.g = Utils::interpolate<RGBPixel::channel_t>(c1.g, c2.g, t);
    c.b = Utils::interpolate<RGBPixel::channel_t>(c1.b, c2.b, t);
    return c;
}

}

#endif // COLOR_H
