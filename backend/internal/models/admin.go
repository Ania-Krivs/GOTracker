package models

type Admin struct {
	ID        uint      `gorm:"primaryKey;column:id"`
	Name      string  	`gorm:"column:name"`
	Email     string    `gorm:"column:email;unique"`
	HashPassword string  `gorm:"column:hash_password" json:"-"`

	Employees []User `gorm:"foreingKey: AdminID" json:"employees,omitempty"` 
}

func (Admin) TableName() string {
	return "admins"
}