%% create a video sequece
vs = VideoWriter('video.avi');
vs.FrameRate = 24;
open(vs);

for i=0:139
    fprintf('processing image %d ...\n', i);
    img = imread(strcat('img', num2str(i), '.png'));
    writeVideo(vs, img);
end

close(vs);