#ifndef COLOR_H
#define COLOR_H

#include "utils.hpp"

namespace Color
{

struct RGB
{
    typedef unsigned char channel_t;
    static const RGB white;
    static const RGB black;
    static const RGB red;
    static const RGB green;
    static const RGB blue;
    static const RGB yellow;

    RGB(){}
    RGB(unsigned char r,
        unsigned char g,
        unsigned char b):r(r), g(g), b(b){}

    RGB operator+(const RGB& rhs)
    {
        RGB c = (*this);
        c.r += rhs.r;
        c.g += rhs.g;
        c.b += rhs.b;
        return c;
    }

    RGB& operator+=(const RGB& rhs)
    {
        r += rhs.r;
        g += rhs.g;
        b += rhs.b;
        return (*this);
    }

    RGB operator*(float f) const
    {
        RGB c = (*this);
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

const RGB RGB::white = RGB(255, 255, 255);
const RGB RGB::black = RGB(0, 0, 0);
const RGB RGB::red = RGB(255, 0, 0);
const RGB RGB::green = RGB(0, 255, 0);
const RGB RGB::blue = RGB(0, 0, 255);
const RGB RGB::yellow = RGB(255, 255, 0);

static RGB interpolate(const RGB& c1, const RGB& c2, float t)
{
    RGB c;
    c.r = Utils::interpolate<RGB::channel_t>(c1.r, c2.r, t);
    c.g = Utils::interpolate<RGB::channel_t>(c1.g, c2.g, t);
    c.b = Utils::interpolate<RGB::channel_t>(c1.b, c2.b, t);
    return c;
}

}

#endif // COLOR_H
