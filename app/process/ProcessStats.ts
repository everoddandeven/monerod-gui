export interface ProcessStats {
    /**
     * percentage (from 0 to 100*vcore)
     */
    cpu: number;
  
    /**
     * bytes
     */
    memory: number;
  
    /**
     * PPID
     */
    ppid: number;
  
    /**
     * PID
     */
    pid: number;
  
    /**
     * ms user + system time
     */
    ctime: number;
  
    /**
     * ms since the start of the process
     */
    elapsed: number;
  
    /**
     * ms since epoch
     */
    timestamp: number;
  }