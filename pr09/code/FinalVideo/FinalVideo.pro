#-------------------------------------------------
#
# Project created by QtCreator 2013-11-21T14:41:02
#
#-------------------------------------------------

QT       += core gui

TARGET = FinalVideo
CONFIG   += console
CONFIG   -= app_bundle
LIBS += -framework OpenGL -framework GLUT

TEMPLATE = app


SOURCES += main.cpp

HEADERS += \
    vec.hpp \
    shape.hpp \
    point.hpp \
    image.hpp \
    color.h \
    ImageUtils.hpp
