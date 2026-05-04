import {
  Column, CreateDateColumn, Entity, JoinColumn,
  ManyToOne, PrimaryGeneratedColumn, Unique,
} from "typeorm";
import { File } from "./file.entity";
import { Process } from "./process.entity";

@Entity("process_versions")
@Unique(["process", "version_number"])
export class ProcessVersion {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Process)
  @JoinColumn({ name: "process_id" })
  process!: Process;

  // убираем @Column() process_id

  @Column()
  version_number!: number;

  @ManyToOne(() => File)
  @JoinColumn({ name: "origin_file_id" })
  originFile!: File;

  // убираем @Column() origin_file_id

  @CreateDateColumn()
  created_at!: Date;

  @Column({ nullable: true })
  working_directory!: string;
}
