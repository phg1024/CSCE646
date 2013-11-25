%% create a video sequece
function createVideo( filename, ...
                   filepath, ...
                   basename, ...
                   extension, ...
                   fstart, ...
                   fend )
                   
vs = VideoWriter(filename);
vs.FrameRate = 24;
open(vs);

for i=fstart:fend
    fprintf('processing image %d ...\n', i);
    img = imread(strcat(filepath, basename, num2str(i), '.', extension));
    writeVideo(vs, img);
end

close(vs);

end