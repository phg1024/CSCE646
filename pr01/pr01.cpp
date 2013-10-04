// =============================================================================
// VIZA654/CSCE646 at Texas A&M University
// Homework 0
// Created by Peihong Guo based from Ariel Chisholm's template
// 09.18.2013
//
// This file is supplied with an associated makefile. Put both files in the same
// directory, navigate to that directory from the Linux shell, and type 'make'.
// This will create a program called 'pr01' that you can run by entering
// 'homework0' as a command in the shell.
//
// If you are new to programming in Linux, there is an
// excellent introduction to makefile structure and the gcc compiler here:
//
// http://www.cs.txstate.edu/labs/tutorials/tut_docs/Linux_Prog_Environment.pdf
//
// =============================================================================

#include <cstdlib>
#include <iostream>

// for Mac compilation
#ifdef __APPLE__
#include <GLUT/glut.h>
#else
#include <GL/glut.h>
#endif

#include <fstream>
#include <cassert>
#include <sstream>
#include <string>
#include <complex>

using namespace std;

// basic RGB color class
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

    channel_t r, g, b;
};

// basic colors
const RGB RGB::white = RGB(255, 255, 255);
const RGB RGB::black = RGB(0, 0, 0);
const RGB RGB::red = RGB(255, 0, 0);
const RGB RGB::green = RGB(0, 255, 0);
const RGB RGB::blue = RGB(0, 0, 255);
const RGB RGB::yellow = RGB(255, 255, 0);

// option input by user
string option;

// basic image class
template <typename T>
class Image
{
public:
    typedef T pixel_t;

    Image():w(0),h(0),pixmap(NULL){}
    Image(int w, int h):w(w),h(h),pixmap(new T[w*h]){}
    ~Image(){ if( pixmap != NULL ) delete[] pixmap; }

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

	// fill a rectangular region in the image
    void fill(int x0, int y0, int width, int height, const T& c)
    {
        int y1 = y0 + height;
        int x1 = x0 + width;
        for(int y=y0;y<y1;y++)
            for(int x=x0;x<x1;x++)
                pixmap[y*w+x] = c;
    }

	// fill the entire image with one color
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

RGBImage img;

RGB interpolate(const RGB& c1, const RGB& c2, float t)
{
    RGB c;
    c.r = c1.r * t + c2.r * (1-t);
    c.g = c1.g * t + c2.g * (1-t);
    c.b = c1.b * t + c2.b * (1-t);
    return c;
}

void fillMandelbrot( const RGB& c1, const RGB& c2, const RGB& c3,
                     int iters )
{
    int centerX = img.width() / 2;
    int centerY = img.height() / 2;

    const int THRES = 1e6;
    for(int y = 0; y < img.height() ; y++) {
        for(int x = 0; x < img.width(); x++) {

            complex<float> z((x-centerX)/(float)img.width() * 3.0 - 0.25, (y-centerY)/(float)img.height() * 3.0);
            complex<float> c = z;

            float val = std::abs(z);
            int i=0;
            while( i++ < iters && val < THRES )
            {
                z = z * z + c;
                val = std::abs(z);
            }

            float t = i / (float)iters;
            t = powf(t, 0.25);
            RGB color;
            if( t >= 1.0 )
                color = c1;
            else
                color = interpolate(c2, c3, t);

            img.setPixel(x, y, color);
        }
    }

}

void fillCircle( const RGB& c, int centerX, int centerY, int radius )
{
    int radius2 = radius * radius;
    for(int y = 0; y < img.height() ; y++) {
        for(int x = 0; x < img.width(); x++) {
            int dx = x - centerX;
            int dy = y - centerY;
            int rr = dx * dx + dy * dy;
            if( rr > radius2 ) continue;

            img.setPixel(x, y, c);
        }
    }
}

void fillCircle_jitter( const RGB& c, const RGB& cb, int centerX, int centerY, int radius )
{
    const int N = 4;
    float h = 1.0f / N;

    int radius2 = radius * radius;
    for(int y = 0; y < img.height() ; y++) {
        for(int x = 0; x < img.width(); x++) {

            // for this pixel, sample N^2 times
            int cnt = 0;
            float dy = y - centerY + 0.5 * h;
            for(int i=0;i<N;i++)
            {
                float dx = x - centerX + 0.5 * h;

                for(int j=0;j<N;j++)
                {
                    float rr = dx * dx + dy * dy;
                    if( rr <= radius2 ) cnt++;

                    dx += h;
                }
                dy += h;
            }

            float t = cnt / (float)(N * N);

            img.setPixel(x, y, interpolate(c, cb, t));
        }
    }
}

void setPixels( const string& option )
{
    if( option == "red" )
        img.fill(RGB::red);
    else if( option == "green" )
        img.fill(RGB::green);
    else if( option == "blue" )
        img.fill(RGB::blue);
    else if( option == "all" )
    {
        int halfW = img.width() / 2;
        int halfH = img.height() / 2;
        img.fill( 0,        0,          halfW,      halfH,      RGB::blue );
        img.fill( halfW,    0,          halfW,      halfH,      RGB::yellow );
        img.fill( 0,        halfH,      halfW,      halfH,      RGB::red );
        img.fill( halfW,    halfH,      halfW,      halfH,      RGB::green );
    }
    else if( option == "circle" )
    {
        img.fill(RGB::blue);
        fillCircle( RGB::yellow, img.width()/2, img.height()/2, img.height()*0.375);
    }
    else if( option == "circle_smooth")
    {
        fillCircle_jitter( RGB::yellow, RGB::blue, img.width()/2, img.height()/2, img.height()*0.375);
    }
    else if( option == "man" )
    {
        fillMandelbrot( RGB::black, RGB::blue, RGB::green, 256);
    }
    else
    {
        // invalid command
        int halfW = img.width() / 2;
        int halfH = img.height() / 2;
        img.fill( 0,        0,          halfW,      halfH,      RGB::blue );
        img.fill( halfW,    0,          halfW,      halfH,      RGB::yellow );
        img.fill( 0,        halfH,      halfW,      halfH,      RGB::red );
        img.fill( halfW,    halfH,      halfW,      halfH,      RGB::green );
    }
}



// =============================================================================
// OpenGL Display and Mouse Processing Functions.
//
// You can read up on OpenGL and modify these functions, as well as the commands
// in main(), to perform more sophisticated display or GUI behavior. This code
// will service the bare minimum display needs for most assignments.
// =============================================================================
static void windowResize(int w, int h)
{
    glViewport(0, 0, w, h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    glOrtho(0,(w/2),0,(h/2),0,1);
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();

    img.resize(w, h);
    setPixels( option );
}

static void windowDisplay(void)
{
    glClear(GL_COLOR_BUFFER_BIT);
    glRasterPos2i(0,0);
    glPixelStorei(GL_UNPACK_ALIGNMENT,1);
    glDrawPixels(img.width(), img.height(), GL_RGB, GL_UNSIGNED_BYTE, img.raw_data());
    glFlush();
}

static void processMouse(int button, int state, int x, int y)
{
    if(state == GLUT_UP)
        exit(0);               // Exit on mouse click.
}

static void processKeyboard(unsigned char key, int x, int y)
{
    switch( key )
    {
    case 27:
        exit(0);
    default:
        break;
    }
}

static void init(void)
{
    glClearColor(1,1,1,1); // Set background color.
}

// =============================================================================
// main() Program Entry
// =============================================================================
int main(int argc, char *argv[])
{
    if( argc < 2 )
        option = "invalid";
    else
    {
        option = argv[1];
    }

    int width, height;

    //initialize the global variables
    width = 640, height = 480;

    img.resize(width, height);
    // set the pixels based on the input option
    setPixels( option );


    // OpenGL Commands:
    // Once "glutMainLoop" is executed, the program loops indefinitely to all
    // glut functions.
    glutInit(&argc, argv);
    glutInitWindowPosition(100, 100); // Where the window will display on-screen.
    glutInitWindowSize(width, height);
    glutInitDisplayMode(GLUT_RGB | GLUT_SINGLE);
    glutCreateWindow("Homework Zero");
    init();
    glutReshapeFunc(windowResize);
    glutDisplayFunc(windowDisplay);
    glutMouseFunc(processMouse);
    glutKeyboardFunc(processKeyboard);
    glutMainLoop();

    return 0; //This line never gets reached. We use it because "main" is type int.
}

