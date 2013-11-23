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
#ifdef WIN32
#include "GL/glut.h"
#else
#include <GLUT/glut.h>
#endif

#include <fstream>
#include <cassert>
#include <sstream>
#include <string>
#include <complex>
#include <cmath>

#include <QImage>

using namespace std;

#include "image.hpp"
#include "imageutils.hpp"

string option;
int samples = 6;

int width, height;

// input images
RGBImage imgs[2];
vector<GrayScaleImagef> masks;

// result image
RGBImage img;

int showIdx;
int currentBlkSize;

RGBImage loadImage(const string& filename) {
    cout << "loading image " << filename << endl;
    QImage img(filename.c_str());
    int w = img.width();
    int h = img.height();

    RGBImage I(w, h);
    for(int y=0;y<h;y++) {
        for(int x=0;x<w;x++) {
            QRgb pix = img.pixel(x, y);
            RGBPixel c(qRed(pix), qGreen(pix), qBlue(pix));
            I.setPixel(x, y, c);
        }
    }
    cout << "done." << endl;
    return I;
}

void saveImage(const RGBImage& img, const string& filename) {
    int w = img.width();
    int h = img.height();

    QImage I(w, h, QImage::Format_ARGB32);

    for(int y=0;y<h;y++) {
        for(int x=0;x<w;x++) {
            RGBImage::pixel_t pix = img.getPixel(x, y);
            I.setPixel(x, y, qRgb(pix.r, pix.g, pix.b));
        }
    }

    I.save(filename.c_str());
}

void createMasks(const RGBImage& img) {
    cout << "creating masks ..." << endl;
    int w = img.width(), h = img.height();
    GrayScaleImagef I(w, h);
    for(int i=0;i<h;i++) {
        for(int j=0;j<w;j++) {
            RGBImage::pixel_t pix = img.getPixel(j, i);

            if( pix.r > 0 ) {
                I.setPixel(j, i, 1.0);
                //cout << (int)pix.r << endl;
            }
            else {
                //cout << (int)pix.r << endl;
                I.setPixel(j, i, 0.0);
            }
        }
    }

    float invSamples = 1.0 / (samples * samples);
    float step = 1.0 / samples;
    // create a set of masks
    for(int i=0;i<256;i++) {
        cout << "level " << i << endl;
        float maskSize = i+1;
        float topY = 0.5 * (h - maskSize);
        float bottomY = topY + maskSize;
        float leftX = topY;
        float rightX = bottomY;

        GrayScaleImagef m(w, h);
        for(int i=0;i<w;i++) {
            int y = i;
            for(int j=0;j<h;j++) {
                int x = j;

                //cout << i << "," << j << endl;

                int cnt = 0;
                for(int ny=0;ny<samples;ny++) {
                    float yy = ny * step + y;
                    float yyy =(yy-topY) / maskSize;
                    for(int nx=0;nx<samples;nx++) {
                        float xx = nx * step + x;
                        float xxx = (xx-leftX) / maskSize;
                        if( xxx >= 0 && xxx < 1.0 && yyy >= 0 && yyy < 1.0 ) {
                            GrayScaleImage::pixel_t pix = I.sample(xxx*(w-1), yyy*(h-1));
                            cnt += pix;
                        }
                    }
                }

                m.setPixel(j, i, cnt * invSamples);
            }
        }

        masks.push_back(m);
    }
    cout << "masks created!" << endl;
}

void fillBlock(int x0, int y0, int x1, int y1,
               const RGBImage& img, RGBImage& I) {
    // compute average color
    float rSum = 0, gSum = 0, bSum = 0;
    for(int y=y0;y<y1;y++) {
        for(int x=x0;x<x1;x++) {
            RGBImage::pixel_t pix = img.getPixel(x, y);
            rSum += pix.r; gSum += pix.g; bSum += pix.b;
        }
    }
    float H = y1 - y0;
    float W = x1 - x0;
    float invA = 1.0 / (H * W);
    // compute average brightness
    float rAvg = rSum * invA, gAvg = gSum * invA, bAvg = bSum * invA;

    int lev = (int)Utils::clamp<float>(0.2989*rAvg + 0.5870*gAvg + 0.1140*bAvg, 128.f, 255.f);
    const GrayScaleImagef& m = masks[lev];

    float hFactor = (m.height() - 1) / H;
    float wFactor = (m.width() - 1) / W;
    float invSamples = 1.0 / (samples * samples);
    float step = 1.0 / samples;
    // apply the mask
    for(int y=y0, i=0;y<y1;y++,i++) {
        float yy = (y - y0);
        for(int x=x0, j=0;x<x1;x++, j++) {
            float xx = (x - x0);

            float mVal = 0;
            for(int ny=0;ny<samples;ny++) {
                float yyy = yy + ny * step;
                for(int nx=0;nx<samples;nx++) {
                    float xxx = xx + nx * step;
                    mVal += m.sample(xxx * wFactor, yyy * hFactor);
                }
            }
            mVal *= invSamples;
            //cout << mVal << endl;
            // color
            I.setPixel(x, y, RGBPixel(rAvg, gAvg, bAvg) * mVal);
        }
    }
}

RGBImage halftone(const RGBImage& img, int blockSize) {
    int w = img.width(), h = img.height();

    RGBImage I(w, h);

    int yBlocks = ceil(h / (float)blockSize);
    int xBlocks = ceil(w / (float)blockSize);

    cout << "blocks: " << yBlocks << "x" << xBlocks << endl;

    for(int i=0;i<yBlocks;i++) {
        int y0 = i * blockSize;
        int y1 = Utils::clamp((i+1) * blockSize, 0, h);
        for(int j=0;j<xBlocks;j++) {
            int x0 = j * blockSize;
            int x1 = Utils::clamp((j+1) * blockSize, 0, w);

            fillBlock(x0, y0, x1, y1, img, I);
        }
    }

    return I;
}

void animation() {

    char filename[1024];
    int totalPic = 120;
    float blkSize = 2;
    int pid = 0;
    RGBImage sImg = imgs[0];
    RGBImage fadeInImg = halftone(imgs[0], 2);
    RGBImage fadeOutImg = halftone(imgs[1], 2);

    float fadeInL = 10.0f, fadeOutL = 10.0f;
    for(int i=0;i<fadeInL;i++,pid++) {
        float ratio = 1.0 - i / (fadeInL-1.0);
        sImg = ImageUtils::blend(imgs[0], fadeInImg, ratio);
        img = ImageUtils::flip(sImg);

        sprintf(filename, "img%d.png", pid);
        saveImage(sImg, filename);

        glClear(GL_COLOR_BUFFER_BIT);
        glRasterPos2i(0,0);
        glPixelStorei(GL_UNPACK_ALIGNMENT,1);
        glDrawPixels(img.width(), img.height(), GL_RGB, GL_UNSIGNED_BYTE, img.raw_data());
        glFlush();
    }

    float transitionL = 10.0f;
    int tstartId = (totalPic-transitionL)/2;

    float ratio=1.0;
    for(int i=0;i<totalPic/2;i++, pid++) {
        blkSize += 2;
        currentBlkSize = Utils::clamp<int>(blkSize, 2, 1280);

        ratio = 1.0 - Utils::clamp((pid - tstartId) / transitionL, 0.0f, 1.0f);
        sImg = ImageUtils::blend(imgs[0], imgs[1], ratio);

        RGBImage hImg = halftone(sImg, currentBlkSize);

        img = ImageUtils::flip(hImg);

        sprintf(filename, "img%d.png", pid);
        saveImage(hImg, filename);

        glClear(GL_COLOR_BUFFER_BIT);
        glRasterPos2i(0,0);
        glPixelStorei(GL_UNPACK_ALIGNMENT,1);
        glDrawPixels(img.width(), img.height(), GL_RGB, GL_UNSIGNED_BYTE, img.raw_data());
        glFlush();
    }

    for(int i=0;i<totalPic/2;i++, pid++) {
        blkSize -= 2;
        currentBlkSize = Utils::clamp<int>(blkSize, 2, 1280);
        ratio = 1.0 - Utils::clamp((pid - tstartId) / transitionL, 0.0f, 1.0f);
        sImg = ImageUtils::blend(imgs[0], imgs[1], ratio);

        RGBImage hImg = halftone(sImg, currentBlkSize);
        img = ImageUtils::flip(hImg);

        sprintf(filename, "img%d.png", pid);
        saveImage(hImg, filename);

        glClear(GL_COLOR_BUFFER_BIT);
        glRasterPos2i(0,0);
        glPixelStorei(GL_UNPACK_ALIGNMENT,1);
        glDrawPixels(img.width(), img.height(), GL_RGB, GL_UNSIGNED_BYTE, img.raw_data());
        glFlush();
    }

    for(int i=0;i<fadeOutL;i++,pid++) {
        float ratio = i / (fadeOutL-1.0);
        sImg = ImageUtils::blend(imgs[1], fadeOutImg, ratio);
        img = ImageUtils::flip(sImg);

        sprintf(filename, "img%d.png", pid);
        saveImage(sImg, filename);

        glClear(GL_COLOR_BUFFER_BIT);
        glRasterPos2i(0,0);
        glPixelStorei(GL_UNPACK_ALIGNMENT,1);
        glDrawPixels(img.width(), img.height(), GL_RGB, GL_UNSIGNED_BYTE, img.raw_data());
        glFlush();
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

    img = ImageUtils::imresize(img, w, h);
    imgs[0] = ImageUtils::imresize(imgs[0], w, h);
    imgs[1] = ImageUtils::imresize(imgs[1], w, h);
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
    case ' ':
    {
        showIdx = (showIdx+1)%2;
        img = ImageUtils::flip(imgs[showIdx]);
        glutPostRedisplay();
        break;
    }
    case 'r':
    case 'R':
    {
        // do animation
        animation();
        break;
    }
    case 'm':
    case 'M':
    {
        int blockSize;
        cout << "Please input block size:" << endl;
        cin >> blockSize;
        img = ImageUtils::flip(halftone(imgs[showIdx], blockSize));
        glutPostRedisplay();
        break;
    }
    case '-':
    {
        currentBlkSize -= 2;
        currentBlkSize = Utils::clamp<int>(currentBlkSize, 2, 1024);
        img = ImageUtils::flip(halftone(imgs[showIdx], currentBlkSize));
        glutPostRedisplay();
        break;
    }
    case '+':
    case '=':
    {
        currentBlkSize += 2;
        currentBlkSize = Utils::clamp<int>(currentBlkSize, 2, 1024);
        img = ImageUtils::flip(halftone(imgs[showIdx], currentBlkSize));
        glutPostRedisplay();
        break;
    }
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
    printf("Usage: ./FinalVideo img1 img2 mask\n");
}

// =============================================================================
// main() Program Entry
// =============================================================================
int main(int argc, char *argv[])
{
    //initialize the global variables
    width = 1280, height = 720;

    if( argc < 4 )
    {
        printHelp();
        exit(-1);
    }
    else {
        showIdx = 0;
        imgs[0] = ImageUtils::imresize(loadImage(argv[1]), width, height);
        imgs[1] = ImageUtils::imresize(loadImage(argv[2]), width, height);
        createMasks(ImageUtils::imresize(loadImage(argv[3]), 256, 256));
        img = ImageUtils::flip(ImageUtils::blend(imgs[0], imgs[1], 0.25));
        cout << "Images loaded." << endl;
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

