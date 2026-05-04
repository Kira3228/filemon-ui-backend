import {
  Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from "typeorm";
import { OSUser } from "./os-user.entity";

@Entity("processes")
@Index("idx_processes_pid_exit", ["pid", "process_exit_time"])
export class Process {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  pid!: number;

  @Column()
  executable_path!: string;

  @Column({ type: "text", nullable: true })
  arguments!: string;

  @Column()
  parent_pid!: number;

  @ManyToOne(() => OSUser, (user) => user.processes)
  @JoinColumn({ name: "os_user_id" })
  osUser!: OSUser;

  // убираем @Column() os_user_id

  @Column()
  group_id!: number;

  @Column({ type: "text", nullable: true })
  environment!: string;

  @Column({ type: "datetime" })
  process_start_time!: Date;

  @Column({ name: "details_source", type: "integer", default: 1 })
  details_source!: number;

  @Column({ type: "datetime", nullable: true })
  process_exit_time!: Date;
} 
