#ifndef COLOR_H
#define COLOR_H

namespace Color
{
template <typename T>
T clamp(T val, T low, T high)
{
    return max(min(val, high), low);
}

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
        r = Color::clamp(r, 0, 255);
        g = Color::clamp(g, 0, 255);
        b = Color::clamp(b, 0, 255);
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
    c.r = c1.r * t + c2.r * (1-t);
    c.g = c1.g * t + c2.g * (1-t);
    c.b = c1.b * t + c2.b * (1-t);
    return c;
}

}

#endif // COLOR_H
