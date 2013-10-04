# Please see the header information in the supplied .ccp file for more
# information on this template project. For more information on C programming
# in Linux, please see the excellent introduction to makefile structure and
# the gcc compiler here:
#
# http://www.cs.txstate.edu/labs/tutorials/tut_docs/Linux_Prog_Environment.pdf

CC		= g++
CFLAGS      = -O2
# uncomment the following line on MacOS
#LDFLAGS 	= -framework GLUT -framework OpenGL -lm
# uncomment the following line on Linux system
LDFLAGS 	= -lGL -lGLUT -lm
PROJECT		= pr01
FILES		= pr01.cpp

${PROJECT}:${FILES}
	${CC} ${CFLAGS} -o ${PROJECT} ${FILES} ${LDFLAGS}
