#ifndef SHAPE_H
#define SHAPE_H

#include <vector>
#include <limits>
using std::vector;
using std::numeric_limits;

#include "point.hpp"
#include "vec.hpp"

struct Shape
{
    Shape(){}
    ~Shape(){}
    virtual float distanceTo(const Point2f& p) const = 0;

    virtual bool isInside(const Point2f& p) const
    {
        return (distanceTo(p) <= 0);
    }
};

struct Edge : public Shape
{
    Edge(){}
    Edge(const Edge& e):
        n(e.n), p(e.p), dir(e.dir){}
    Edge(const Point2f& p, const Vector2f& n, const Vector2f& dir):
        n(n), p(p), dir(dir){}

    float distanceTo(const Point2f &pt) const
    {
        return n.dot(Vector2f(p, pt));
    }

    Vector2f n;
    Point2f p;
    Vector2f dir;
};

template <typename T>
struct Polygon : public Shape
{
    Polygon(){}

    /// ray casting
    bool isInside_raycast( const Point2f& p ) const
    {
        const double THRES = 1e-6;
        int cnt = 0;
        for(size_t i=0;i<e.size();i++)
        {
            const Vector2f& dir = e[i].dir;

            bool flag = false;

            // horizontal line
            if( dir.y == 0 )
            {
                if( fabs(e[i].p.y - p.y) < THRES )
                    flag = true;
            }
            else
            {
                // test intersection of lines
                // intersection point (xi, yi)
                // v[i].x + t * dir.x = xi
                // v[i].y + t * dir.y = yi = p.y
                double t = (p.y - e[i].p.y) / dir.y;
                if( t > -THRES && t < 1 + THRES )
                {
                    double xi = e[i].p.x + t * dir.x;
                    if( xi >= p.x )
                        flag = true;
                }
            }

            if( flag ) cnt++;
        }

        // inside if the number of intersections is odd
        // otherwise outside
        return (cnt & 0x1);
    }

    float distanceTo(const Point2f &p) const
    {
        float res = -numeric_limits<float>::max();
        for(size_t i=0;i<e.size();i++)
        {
            float dist = e[i].distanceTo(p);
            if( dist > res ) res = dist;
        }
        return res;
    }

    void genEdges()
    {
        e.clear();
        for(size_t i=0;i<v.size();i++)
        {
            size_t j = (i+1);
            j = (j==v.size()?0:j);

            Vector2f dir(v[i], v[j]);

            // normal
            Vector2f n(dir.y, -dir.x);
            n.normalize();

            e.push_back(Edge(v[i], n, dir));
        }
    }

    vector<Edge> e;
    vector<Point2<T> > v;
};


typedef Polygon<int> Polygoni;
typedef Polygon<float> Polygonf;
typedef Polygon<double> Polygond;

struct Star : public Shape
{
    Star(float x, float y, float radius, int corners):
        x(x), y(y), radius(radius), corners(corners)
    {
        e.resize(corners);

        const float PI = 3.1415926;
        float theta = PI / corners;
        Point2f center(x, y);
        for(int i=0;i<corners;i++)
        {
            e[i].n = Vector2f(cos(theta), sin(theta));
            e[i].p = center + Point2f(cos(theta), sin(theta)) * radius;
            theta += (2.0 * PI / corners);
        }
    }

    float distanceTo(const Point2f &pt) const
    {
        int cnt=0;
        for(int i=0;i<corners;i++)
        {
            float v = e[i].distanceTo(pt);
            if( v <= 0 )
                cnt++;
        }
        // simply inside/outside
        return (cnt>=(corners-1))?-1:1;
    }

    float x, y;
    float radius;
    int corners;
    vector<Edge> e;
};

struct Circle : public Shape
{
    Circle(float x, float y, float radius):
        x(x), y(y), radius(radius)
    {
        radius2 = radius * radius;
    }

    float distanceTo(const Point2f &p) const
    {
        float dx = p.x - x;
        float dy = p.y - y;

        float dist = sqrt(dx * dx + dy * dy) - radius;
        return dist;
    }

    float x, y;
    float radius, radius2;
};

struct Blobby : public Shape
{
    Blobby(){}

    void addCircle(const Circle& c)
    {
        circles.push_back(c);
    }

    float distanceTo(const Point2f &p) const
    {
        float alpha = 1.5e-4;

        float res = 0;
        for(size_t i=0;i<circles.size();i++)
        {
            float dx = p.x - circles[i].x;
            float dy = p.y - circles[i].y;
            res += exp( -alpha * ( (dx*dx + dy*dy) - circles[i].radius2 ) );
        }


        res = -1/alpha * log(res);
        return res;
    }

    static const int MAXBALLS = 100;
    vector<Circle> circles;
};

struct Function : public Shape
{
    Function(float (*fn)(float x, float y)):
        fn(fn)
    {}

    float distanceTo(const Point2f &p) const
    {
        return (*fn)(p.x, p.y);
    }

    float (*fn)(float x, float y);
};

#endif // SHAPE_H
