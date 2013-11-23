#-------------------------------------------------
#
# Project created by QtCreator 2013-11-21T14:41:02
#
#-------------------------------------------------

QT       += core gui

TARGET = FinalVideo
CONFIG   += console
CONFIG   -= app_bundle

win32 {
INCLUDEPATH += "C:\Libs\freeglut-2.8.1\include"
LIBS += "C:\Libs\freeglut-2.8.1\lib\x64\freeglut.lib"
}

#LIBS += -framework OpenGL -framework GLUT

TEMPLATE = app


SOURCES += main.cpp

HEADERS += \
    vec.hpp \
    point.hpp \
    image.hpp \
    color.h \
    ImageUtils.hpp \
    utils.hpp
