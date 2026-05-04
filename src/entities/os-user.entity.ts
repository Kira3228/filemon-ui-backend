import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { Process } from "./process.entity";

@Entity("os_users")
export class OSUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  uid!: number;

  @Column()
  gid!: number;

  @Column({ nullable: true })
  username!: string;

  @Column({ nullable: true })
  home_directory!: string;

  @Column({ nullable: true })
  shell!: string;

  @Column({ nullable: true })
  full_name!: string;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Process, (p) => p.osUser)
  processes!: Process[];
}
