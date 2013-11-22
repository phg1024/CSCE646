// =============================================================================
// VIZA654/CSCE646 at Texas A&M University
// Homework 1
// Created by Anton Agana based from Ariel Chisholm's template
// 05.23.2011
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
#include <GLUT/glut.h>

#include <fstream>
#include <cassert>
#include <sstream>
#include <string>
#include <complex>
#include <cmath>

#include <QImage>

using namespace std;

#include "image.hpp"
#include "shape.hpp"

string option;
int samples = 8;

int width, height;

// input images
RGBImage img1, img2, maskImg;
// result image
RGBImage img;


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
    img1.resize(w, h);
    img2.resize(w, h);
}

static void windowDisplay(void)
{
    glClear(GL_COLOR_BUFFER_BIT);
    glRasterPos2i(0,0);
    glPixelStorei(GL_UNPACK_ALIGNMENT,1);
    glDrawPixels(img.width(), img.height(), GL_RGB, GL_UNSIGNED_BYTE, img.raw_data());
    glFlush();
}

static void processMotion(int x, int y)
{
}

static void processMouse(int button, int state, int x, int y)
{
    switch( button )
    {
    case GLUT_LEFT_BUTTON:
    {
        if( state == GLUT_DOWN )
        {
        }
        break;
    }
    case GLUT_RIGHT_BUTTON:
    {
        break;
    }
    default:
        break;
    }
    glutPostRedisplay();
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

void printHelp()
{

}

RGBImage fromQImage(const QImage& img) {
    int w = img.width();
    int h = img.height();

    RGBImage I(w, h);
    for(int y=0;y<h;y++) {
        for(int x=0;x<w;x++) {
            QRgb pix = img.pixel(x, y);
            RGB c(qRed(pix), qGreen(pix), qBlue(pix));
            I.setPixel(x, y, c);
        }
    }
    return I;
}

// =============================================================================
// main() Program Entry
// =============================================================================
int main(int argc, char *argv[])
{
    //initialize the global variables
    width = 1024, height = 768;

    if( argc < 4 )
    {
        printHelp();
    }
    else {
        img1 = fromQImage(QImage(argv[1]));
        img2 = fromQImage(QImage(argv[2]));
        maskImg = fromQImage(QImage(argv[3]));
    }

    // OpenGL Commands:
    // Once "glutMainLoop" is executed, the program loops indefinitely to all
    // glut functions.
    glutInit(&argc, argv);
    glutInitWindowPosition(100, 100); // Where the window will display on-screen.
    glutInitWindowSize(width, height);
    glutInitDisplayMode(GLUT_RGB | GLUT_SINGLE);
    glutCreateWindow("Final Video");
    init();
    glutReshapeFunc(windowResize);
    glutDisplayFunc(windowDisplay);
    glutMouseFunc(processMouse);
    glutMotionFunc(processMotion);
    glutKeyboardFunc(processKeyboard);
    glutMainLoop();

    return 0; //This line never gets reached. We use it because "main" is type int.
}

