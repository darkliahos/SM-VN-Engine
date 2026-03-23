import { Coordinate } from './Coordinate';

export class Character {
  public Identifier: string = '';
  public FriendlyName: string = '';
  public DisplayName: string = '';
  public Position: Coordinate = new Coordinate();
  public SpriteHeight: number = 50;
  public SpriteWidth: number = 50;
  public CurrentSprite: string = '';
  public InScene: boolean = false;
}
