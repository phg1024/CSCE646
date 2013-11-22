#ifndef VEC_HPP
#define VEC_HPP

#include "point.hpp"

template <typename T>
struct Vector2 : public Point2<T>
{
    Vector2(){}
    Vector2(const Vector2& v):Point2<T>(v.x, v.y){}
    Vector2(T x, T y):Point2<T>(x, y){}

    // minus constructor
    Vector2(const Point2<T>& p0, const Point2<T>& p1):
        Point2<T>(p1.x - p0.x, p1.y - p0.y){}

    T cross( const Vector2& v ) const
    {
        return this->x * v.y - v.x * this->y;
    }

    T dot( const Vector2& v ) const
    {
        return this->x * v.x + this->y * v.y;
    }

    T norm() const
    {
        return sqrt(this->x * this->x + this->y * this->y);
    }

    void normalize()
    {
        T v = this->norm();
        if( v == 0 )
            return;

        this->x /= v;
        this->y /= v;
    }
};

typedef Vector2<int> Vector2i;
typedef Vector2<float> Vector2f;
typedef Vector2<double> Vector2d;

#endif // VEC_HPP
