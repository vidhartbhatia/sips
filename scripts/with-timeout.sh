#!/bin/sh
# Usage: scripts/with-timeout.sh <seconds> <command> [args...]
# Runs the command in its own process group with stdin closed, and kills the whole group
# (not just the first process) when time runs out. Exits 124 on timeout, 127 if the command
# can't start, otherwise with the command's own exit code. macOS has no `timeout`.
exec perl -e '
  my $t = shift;
  my $pid = fork() // die "fork failed: $!\n";
  if ($pid == 0) {
    setpgrp(0, 0);
    open(STDIN, "<", "/dev/null");
    exec { $ARGV[0] } @ARGV or do { print STDERR "cannot run $ARGV[0]: $!\n"; exit 127 };
  }
  $SIG{ALRM} = sub {
    kill "TERM", -$pid; sleep 2; kill "KILL", -$pid;
    print STDERR "timed out after ${t}s\n"; exit 124;
  };
  alarm $t;
  waitpid($pid, 0);
  exit($? & 127 ? 128 + ($? & 127) : $? >> 8);
' "$@"
