#ifndef POINT_HPP
#define POINT_HPP

template <typename T>
struct Point2
{
    Point2(){}
    Point2(T x, T y):x(x), y(y){}
    Point2(const Point2& p):x(p.x), y(p.y){}

    template <typename PT>
    Point2( const Point2<PT>& p ):x(p.x), y(p.y){}

    Point2 operator+(const Point2& rhs)
    {
        return Point2(x+rhs.x, y+rhs.y);
    }

    Point2 operator-(const Point2& rhs)
    {
        return Point2(x-rhs.x, y-rhs.y);
    }

    template <typename FT>
    Point2 operator*(const FT& f)
    {
        return Point2(x*f, y*f);
    }

    template <typename FT>
    Point2 operator/(const FT& f)
    {
        return Point2(x/f, y/f);
    }

    T x, y;
};

typedef Point2<int> Point2i;
typedef Point2<float> Point2f;
typedef Point2<double> Point2d;

#endif // POINT_HPP
