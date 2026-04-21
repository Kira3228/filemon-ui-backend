import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { File } from "./file.entity";

@Entity("filesystems")
export class Filesystem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @OneToMany(() => File, (file) => file.filesystem)
  files: File[];
}