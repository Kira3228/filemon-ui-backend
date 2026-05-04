import {
  Column, CreateDateColumn, Entity, JoinColumn,
  ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique,
} from "typeorm";
import { FileVersion } from "./file-version.entity";
import { Filesystem } from "./file-system.entity";
import { ProcessVersion } from "./process-version";

@Entity("files")
@Unique(["filesystem", "filehandle"])
export class File {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Filesystem, (fs) => fs.files)
  @JoinColumn({ name: "filesystem_id" })
  filesystem!: Filesystem;

  // убираем @Column() filesystem_id

  @Column("blob")
  filehandle!: Buffer;

  @Column()
  full_path!: string;

  @Column({ name: "last_status", type: "integer" })
  status!: number;

  @Column({ name: "ino_gen" })
  inoGen!: string;

  @ManyToOne(() => ProcessVersion, { nullable: true })
  @JoinColumn({ name: "origin_process_version_id" })
  originProcessVersion!: ProcessVersion;

  // убираем @Column() origin_process_version_id

  @Column({ name: "last_status_at", type: "datetime" })
  last_status_at!: Date;

  @CreateDateColumn()
  tracking_started_at!: Date;

  @Column()
  initial_size_bytes!: number;

  @Column({ type: "datetime" })
  birth_time!: Date;

  @OneToMany(() => FileVersion, (fv) => fv.file)
  versions!: FileVersion[];
}
