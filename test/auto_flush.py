import sys


class AutoFlushIO:
    def __init__(self, stream):
        self.stream = stream

    def write(self, s):
        self.stream.write(s)
        self.stream.flush()

    def flush(self):
        self.stream.flush()


sys.stdout = AutoFlushIO(sys.__stdout__)
sys.stderr = AutoFlushIO(sys.__stderr__)

# # import sys;sys.stdout=sys.stderr=type("F",(),{"__init__":lambda s,o:setattr(s,"o",o),"write":lambda s,x:(s.o.write(x),s.o.flush()),"flush":lambda s:s.o.flush()})(sys.__stdout__)

# import sys;sys.stdout=type("F",(),{"__init__":lambda s,o:setattr(s,"s",o),"write":lambda s,x:(s.s.write(x),s.s.flush()),"flush":lambda s:s.s.flush()})(sys.__stdout__);sys.stderr=type("F",(),{"__init__":lambda s,o:setattr(s,"s",o),"write":lambda s,x:(s.s.write(x),s.s.flush()),"flush":lambda s:s.s.flush()})(sys.__stderr__)
